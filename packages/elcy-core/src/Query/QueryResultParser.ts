import { DbValue, IObjectType, StringKeyOf, ValueType } from "../Common/Type";
import { DbContext } from "../Data/DbContext";
import { DbSet } from "../Data/DbSet";
import { EntityEntry } from "../Data/EntityEntry";
import { EntityState } from "../Data/EntityState";
import { DBEventEmitter } from "../Data/Event/DbEventEmitter";
import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { isColumnExp, isNull, isValue, isValueType } from "../Helper/Util";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { IncludeRelation } from "../Queryable/Interface/IncludeRelation";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryResult } from "./IQueryResult";
import { IQueryResultParser } from "./IQueryResultParser";
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";
import { GroupByExpression } from "src/Queryable/QueryExpression/GroupByExpression";
import { IGroupArray } from "src/Common/IGroupArray";

type ParserFunction<T = unknown> = (dbContext: DbContext, parseMap: Map<SelectExpression, ParserFunction>, id?: Record<string, ValueType>) => Generator<T, unknown, unknown>;
function compare<T extends object>(obj: T, id: Record<keyof T, ValueType>) {
    for (const prop in id) {
        if (obj[prop] > id[prop]) {
            return 1;
        }
        if (obj[prop] < id[prop]) {
            return -1;
        }
    }

    return 0;
}
function getRelationKey<T extends object>(data: T, props?: Array<keyof T>) {
    if (!Array.isArray(props)) {
        return "";
    }
    return props.map((o) => data[o]).join("|");
}
const getColumnValue = <TE extends object, T>(column: IColumnExpression<TE, T>, data: Record<string, DbValue>, dbContext?: DbContext) => {
    const columnMeta: IColumnMetaData<any, any> = column.columnMeta ?? { type: column.type, nullable: column.isNullable };
    return dbContext.queryBuilder.hydrateValue(data[column.dataPropertyName], columnMeta) as T;
}
const setEntryColumnValue = <TE extends object = object, T = ValueType>(entry: EntityEntry<TE>, column: IColumnExpression<TE, T>, data: Record<string, DbValue>, dbContext?: DbContext) => {
    const value = getColumnValue(column, data, dbContext);
    if (isValue(value)) {
        entry.setOriginalValue(column.propertyName, value as TE[StringKeyOf<TE>]);
        return;
    }

    setColumnValue(entry.entity, column, data, dbContext);
}
const setColumnValue = <TE extends object = object, TType = TE[StringKeyOf<TE>]>(entity: TE, column: IColumnExpression<TE, TType>, data: Record<string, DbValue>, dbContext?: DbContext) => {
    const value = getColumnValue(column, data, dbContext);
    entity[column.propertyName] = value as TE[StringKeyOf<TE>];
}

class SelectExpressionParserFactory<TE extends object, T> {
    public readonly itemSelectExp: SelectExpression<TE, T>;
    constructor(public readonly selectExp: SelectExpression<TE, T>) {
        this.itemSelectExp = selectExp;
        if (selectExp instanceof GroupByExpression && !selectExp.isAggregated) {
            this.itemSelectExp = selectExp.itemSelect;
        }

        this.isValue = isValueType(this.itemSelectExp.itemType);
        this.columns = this.itemSelectExp.selects;
        this.primaryColumns = this.itemSelectExp.entity.primaryColumns;
        const entityMetaData = getEntityMetadata(this.itemSelectExp.itemType as unknown as IObjectType<TE>);
        if (entityMetaData) {
            this.columns = this.columns.concat(Array.from(this.itemSelectExp.relationColumns));
            this.primaryColumns = Enumerable.from(this.primaryColumns)
                .union(Enumerable.from(this.itemSelectExp.resolvedSelects).filter((o) => entityMetaData.primaryKeys.some((c) => c.propertyName === o.propertyName)))
                .toArray();
        }

        this.relationMap = new Map();
        if (this.itemSelectExp.entity instanceof EntityExpression && this.itemSelectExp.entity.metaData) {
            const metaData = this.itemSelectExp.entity.metaData;
            for (const include of this.itemSelectExp.includes) {
                const relationMeta = metaData.relations.find((o) => o.propertyName === include.name);
                if (relationMeta) {
                    this.relationMap.set(include, relationMeta.reverseRelation);
                }
            }
        }

        this.embeddedParserMap = {};
        if (this.selectExp instanceof GroupByExpression) {
            const keyRelation = this.selectExp.keyRelation;
            if (keyRelation && keyRelation.isEmbedded) {
                this.embeddedParserMap[keyRelation.name] = new SelectExpressionParserFactory(keyRelation.child);
            }
            for (const include of this.selectExp.itemSelect.includes) {
                if (include.isEmbedded) {
                    this.embeddedParserMap[include.name] = new SelectExpressionParserFactory<object, unknown>(include.child);
                }
            }
        }
        else {
            for (const include of this.selectExp.includes) {
                if (include.isEmbedded) {
                    this.embeddedParserMap[include.name] = new SelectExpressionParserFactory<object, unknown>(include.child);
                }
            }
        }
    }
    protected readonly isValue: boolean;
    protected readonly columns: IColumnExpression[];
    protected readonly primaryColumns: IColumnExpression<TE>[];
    protected readonly relationMap: Map<IncludeRelation<TE>, IRelationMetaData>;
    protected readonly embeddedParserMap: Record<string, SelectExpressionParserFactory<object, unknown>>;

    protected parseRow(row: Record<string, DbValue>, dbContext: DbContext, dbSet: DbSet<TE>, dbEventEmitter: DBEventEmitter<TE>, parseMap: Map<SelectExpression, ParserFunction>) {
        if (this.isValue) {
            for (const column of this.columns) {
                return getColumnValue(column, row, dbContext);
            }
        }

        if (!dbSet) {
            const data = new (this.itemSelectExp.itemType as IObjectType<T & object> ?? Object)();
            // set column data
            for (const column of this.columns) {
                setColumnValue(data, column, row, dbContext);
            }

            this.parseInclude(data, row, dbContext, parseMap);
            return data;
        }

        let data = new (this.itemSelectExp.itemType as unknown as IObjectType<TE>)();
        for (const primaryCol of this.primaryColumns) {
            setColumnValue(data, primaryCol, row, dbContext);
        }

        // load existing entity
        var entry = dbSet.entry(data);
        if (entry.state === EntityState.Detached) {
            entry.state = EntityState.Unchanged;
        }
        else {
            data = entry.entity;
        }

        // set column data
        for (const column of this.columns) {
            setEntryColumnValue(entry, column, row, dbContext);
        }

        this.parseInclude(data, row, dbContext, parseMap, dbSet);

        if (entry) {
            entry.enableTrackChanges = true;
            // emit after load event
            if (dbEventEmitter) {
                dbEventEmitter.emitAfterLoadEvent(entry);
            }
        }

        return data;
    }

    public parseInclude<T extends object>(data: T, row: object, dbContext: DbContext, parseMap: Map<SelectExpression, ParserFunction>, dbSet?: DbSet<T>) {            // load relations
        for (const include of this.itemSelectExp.includes) {
            const includeProperty = include.name as keyof T;
            if (include.isEmbedded) {
                const parserFactory = this.embeddedParserMap[include.name];
                const parser = parserFactory.getGenerator({
                    rows: [row]
                });
                const childEntities = Enumerable.from(parser(dbContext, parseMap));
                data[includeProperty] = childEntities.find() as T[keyof T] ?? null;
                continue;
            }

            const parser = parseMap.get(include.child) as ParserFunction<Record<string, unknown>>;
            const relId: Record<string, ValueType> = {};
            for (const [col, childCol] of include.relationMap()) {
                relId[childCol.dataPropertyName] = row[col.dataPropertyName as keyof object];
            }
            const childEntities = Enumerable.from(parser(dbContext, parseMap, relId));
            if (include.type === "many") {
                let includes = data[includeProperty] as unknown[];
                if (!Array.isArray(includes)) {
                    includes = [];
                    data[includeProperty] = includes as T[keyof T];
                }

                for (const child of childEntities) {
                    includes.push(child);
                }
            }
            else {
                data[includeProperty] = childEntities.find() as T[keyof T] ?? null;
            }

            if (!dbSet) {
                continue;
            }

            const reverseRelation = this.relationMap.get(include);
            if (!reverseRelation) {
                continue;
            }

            for (const child of childEntities) {
                if (reverseRelation.relationType === "many") {
                    let childRelProperty = child[reverseRelation.propertyName] as unknown[];
                    if (!Array.isArray(childRelProperty)) {
                        childRelProperty = child[reverseRelation.propertyName] = [];
                    }
                    childRelProperty.push(data);
                }
                else {
                    child[reverseRelation.propertyName] = data;
                }
            }
        }
    }
    public getGenerator(queryResult: IQueryResult): ParserFunction<T> {
        if (!queryResult?.rows?.some(o => true)) {
            return function* () { };
        }

        let iterResult: IteratorResult<unknown, any>;
        const groupedRawMap = new Map<string, any[]>();
        const groupedDataMap = new Map<string, T[]>();

        const source = Enumerable.from(queryResult.rows)[Symbol.iterator]();
        const context = this;
        const selectExp = this.selectExp;
        const isGroup = this.selectExp instanceof GroupByExpression && !this.selectExp.isAggregated;
        const generator = function* (dbContext: DbContext, parseMap: Map<SelectExpression, ParserFunction>, id?: Record<string, ValueType>) {
            let idKey = isNull(id) ? "" : getRelationKey(id, Object.keys(id));
            if (Array.isArray(groupedDataMap.get(idKey))) {
                for (const res of groupedDataMap.get(idKey)) {
                    yield res;
                }
            }
            const dbSet = dbContext.set(context.itemSelectExp.itemType as unknown as IObjectType<TE>);
            let dbEventEmitter: DBEventEmitter<TE>;
            if (dbSet) {
                dbEventEmitter = new DBEventEmitter<TE>(dbSet.metaData, dbContext);
            }

            if (Array.isArray(groupedRawMap.get(idKey))) {
                const rawRows = groupedRawMap.get(idKey);
                groupedRawMap.delete(idKey);
                for (const row of rawRows) {
                    const item = context.parseRow(row, dbContext, dbSet, dbEventEmitter, parseMap);
                    const groupId = getRelationKey(row, isNull(id) ? [] : Object.keys(id));
                    let groupDatas: T[] = groupedDataMap.get(groupId);
                    if (!Array.isArray(groupDatas)) {
                        groupDatas = [];
                        groupedDataMap.set(groupId, groupDatas);
                    }
                    groupDatas.push(item as T);
                    yield item;
                }
            }

            do {
                if (iterResult?.done) {
                    if (isGroup) {
                        const groupData = groupedDataMap.get(idKey) as IGroupArray<any, any>;
                        yield groupData;
                    }
                    return;
                }

                if (iterResult) {
                    const row = iterResult.value;
                    if (isGroup) {
                        const groupSelectExp = selectExp as unknown as GroupByExpression<TE, unknown, T>;
                        if (!id) {
                            id = {};
                            for (const col of groupSelectExp.groupBy) {
                                id[col.dataPropertyName] = row[col.dataPropertyName];
                            }
                            idKey = getRelationKey(id, Object.keys(id));
                        }
                        let compareResult = compare(row, id);
                        if (compareResult === 1) {
                            const groupData = groupedDataMap.get(idKey) as IGroupArray<any, any>;
                            yield groupData as T;

                            compareResult = 0;
                            id = {};
                            for (const col of groupSelectExp.groupBy) {
                                id[col.dataPropertyName] = row[col.dataPropertyName];
                            }
                            idKey = getRelationKey(id, Object.keys(id));
                        }
                        if (compareResult === -1) {
                            throw "unexpected";
                        }
                        if (compareResult === 0) {
                            const item = context.parseRow(row, dbContext, dbSet, dbEventEmitter, parseMap);
                            let groupDatas = groupedDataMap.get(idKey) as IGroupArray<T, unknown>;
                            if (!Array.isArray(groupDatas)) {
                                groupDatas = [] as IGroupArray<T, unknown>;
                                groupedDataMap.set(idKey, groupDatas);

                                const keyExp = groupSelectExp.key;
                                if (groupSelectExp.keyRelation) {
                                    if (groupSelectExp.keyRelation.isEmbedded) {
                                        const parserFactory = context.embeddedParserMap[groupSelectExp.keyRelation.name];
                                        const parser = parserFactory.getGenerator({
                                            rows: [row]
                                        });
                                        const childEntities = Enumerable.from(parser(dbContext, parseMap));
                                        groupDatas[groupSelectExp.keyRelation.name] = childEntities.find() ?? null;
                                    }
                                    else {
                                        const parser = parseMap.get(groupSelectExp.keyRelation.child);
                                        const childEntities = Enumerable.from(parser(dbContext, parseMap, id));
                                        groupDatas[groupSelectExp.keyRelation.name] = childEntities.find() ?? null;
                                    }
                                }
                                else if (isColumnExp(keyExp)) {
                                    groupDatas.key = getColumnValue(keyExp, row, dbContext);
                                }
                            }
                            groupDatas.push(item as T);
                        }
                    }
                    else {
                        let compareResult = 0;
                        if (id) {
                            compareResult = compare(row, id);
                        }
                        if (compareResult === 1) {
                            return;
                        }
                        if (compareResult === -1) {
                            const groupId = getRelationKey(row, isNull(id) ? [] : Object.keys(id));
                            let groupDatas: any[] = groupedRawMap.get(groupId);
                            if (!Array.isArray(groupDatas)) {
                                groupDatas = [];
                                groupedRawMap.set(groupId, groupDatas);
                            }
                            groupDatas.push(row);
                        }
                        else if (compareResult === 0) {
                            const item = context.parseRow(row, dbContext, dbSet, dbEventEmitter, parseMap);
                            let groupDatas: T[] = groupedDataMap.get(idKey);
                            if (!Array.isArray(groupDatas)) {
                                groupDatas = [];
                                groupedDataMap.set(idKey, groupDatas);
                            }
                            groupDatas.push(item as T);
                            yield item;
                        }
                    }
                }

                iterResult = source.next();
            } while (true);
        };

        return generator as ParserFunction<T>;
    }
}

export class QueryResultParser<T> implements IQueryResultParser<T> {
    public get expressionParsers() {
        if (!this._expressionParsers) {
            const orderedSelects: SelectExpression<object, any>[] = [this.queryExpression];
            for (let i = orderedSelects.length - 1; i >= 0; i--) {
                const select = orderedSelects[i];
                const addition = Array.from(select.resolvedIncludes.map((o) => o.child));
                orderedSelects.splice(i, 0, ...addition);
                i += addition.length;
            }

            this._expressionParsers = orderedSelects.map(o => new SelectExpressionParserFactory(o));
        }
        return this._expressionParsers;
    }
    public queryBuilder: IQueryBuilder;
    public queryExpression: SelectExpression<object, T>;
    private _expressionParsers: SelectExpressionParserFactory<object, any>[];
    public parse(queryResults: IQueryResult[], dbContext: DbContext): IEnumerable<T> {
        const parserMap = new Map<SelectExpression<object, any>, ParserFunction>();
        for (let i = 0; i < this.expressionParsers.length; i++) {
            const parser = this.expressionParsers[i];
            const queryResult = queryResults[i];
            const generator = parser.getGenerator(queryResult);
            parserMap.set(parser.selectExp, generator);
        }
        const mainParser = parserMap.get(this.queryExpression) as ParserFunction<T>;
        return Enumerable.from(mainParser(dbContext, parserMap, undefined));
    }
}

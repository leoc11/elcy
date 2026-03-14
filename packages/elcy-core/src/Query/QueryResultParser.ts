import { IObjectType, StringKeyOf, ValueType } from "../Common/Type";
import { DbContext } from "../Data/DbContext";
import { DbSet } from "../Data/DbSet";
import { EntityEntry } from "../Data/EntityEntry";
import { EntityState } from "../Data/EntityState";
import { DBEventEmitter } from "../Data/Event/DbEventEmitter";
import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { isNull, isValue, isValueType } from "../Helper/Util";
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

type ParserFunction<T = unknown> = (dbContext: DbContext, parseMap: Map<SelectExpression, ParserFunction>, id?: Record<string, ValueType>) => Generator<T, unknown, unknown>;
function compare(obj: object, id: Record<string, ValueType>) {
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
function getRelationKey(data: object, props?: string[]) {
    if (!Array.isArray(props)) {
        return "";
    }
    return props.reduce((res, o) => res + data[o], "");
}
const getColumnValue = <TE extends object, T>(column: IColumnExpression<TE, T>, data: any, dbContext?: DbContext) => {
    const columnMeta: IColumnMetaData<any, any> = column.columnMeta ? column.columnMeta : { type: column.type, nullable: column.isNullable };
    return dbContext.queryBuilder.toPropertyValue(data[column.dataPropertyName], columnMeta) as T;
}
const setEntryColumnValue = <TE extends object = object, TType extends TE[StringKeyOf<TE>] = TE[StringKeyOf<TE>]>(entry: EntityEntry<TE>, column: IColumnExpression<TE, TType>, data: any, dbContext?: DbContext) => {
    const value = getColumnValue(column, data, dbContext);
    if (isValue(value)) {
        entry.setOriginalValue(column.propertyName, value);
        return;
    }

    setColumnValue(entry.entity, column, data, dbContext);
}
const setColumnValue = <TE extends object = object, TType extends TE[StringKeyOf<TE>] = TE[StringKeyOf<TE>]>(entity: TE, column: IColumnExpression<TE, TType>, data: any, dbContext?: DbContext) => {
    const value = getColumnValue(column, data, dbContext);
    entity[column.propertyName] = value;
}
class SelectExpressionParserFactory<TE extends object, T> {
    constructor(public readonly selectExp: SelectExpression<TE, T>) {
        this.isValue = isValueType(selectExp.itemType);
        this.columns = selectExp.selects;
        this.primaryColumns = selectExp.entity.primaryColumns.filter((o) => o.columnName !== "__index");
        const entityMetaData = getEntityMetadata(selectExp.itemType as unknown as IObjectType<TE>);
        if (entityMetaData) {
            this.columns = this.columns.concat(Array.from(selectExp.relationColumns));
            this.primaryColumns = this.primaryColumns.concat(Array.from(selectExp.resolvedSelects).filter((o) => entityMetaData.primaryKeys.some((c) => c.propertyName === o.propertyName)));
        }

        this.relationMap = new Map();
        if (selectExp.entity instanceof EntityExpression && selectExp.entity.metaData) {
            const metaData = selectExp.entity.metaData;
            for (const include of selectExp.includes) {
                const relationMeta = metaData.relations.find((o) => o.propertyName === include.name);
                if (relationMeta) {
                    this.relationMap.set(include, relationMeta.reverseRelation);
                }
            }
        }
    }
    protected readonly isValue: boolean;
    protected readonly columns: IColumnExpression<TE, ValueType>[];
    protected readonly primaryColumns: IColumnExpression<TE, ValueType>[];
    protected readonly relationMap: Map<IncludeRelation<TE, object>, IRelationMetaData>;

    protected parseRow(row: object, dbContext: DbContext, dbSet: DbSet<T & TE>, dbEventEmitter: DBEventEmitter<T & TE>, parseMap: Map<SelectExpression, ParserFunction>) {
        if (this.isValue) {
            for (const column of this.columns) {
                return getColumnValue(column as IColumnExpression<TE, T>, row, dbContext);
            }
        }
        
        let data = new (this.selectExp.itemType as IObjectType<T & TE>)();
        let entry: EntityEntry<T & TE>;
        // load existing entity
        if (dbSet) {
            for (const primaryCol of this.primaryColumns) {
                setColumnValue<any, any>(data, primaryCol, row, dbContext);
            }

            entry = dbSet.entry(data);
            if (entry.state === EntityState.Detached) {
                entry.state = EntityState.Unchanged;
            }
            else {
                data = entry.entity;
            }
        }

        // set column data
        for (const column of this.columns) {
            if (entry) {
                setEntryColumnValue(entry, column as unknown as IColumnExpression<T & TE, any>, row, dbContext);
            }
            else {
                setColumnValue(data, column as unknown as IColumnExpression<T & TE, any>, row, dbContext);
            }
        }

        // load relations
        for (const include of this.selectExp.includes) {
            const parser = parseMap.get(include.child);
            const relId = {};
            for (const [col, childCol] of include.relationMap()) {
                relId[childCol.propertyName as string] = data[col.propertyName as string];
            }
            const childEntities = Enumerable.from(parser(dbContext, parseMap, relId));
            if (include.isEmbedded) {
                data[include.name] = childEntities.find() ?? null;
            }
            else if (include.type === "many") {
                if (!data[include.name]) {
                    data[include.name] = [];
                }

                for (const child of childEntities) {
                    data[include.name].push(child);
                }
            }
            else {
                data[include.name] = childEntities.find() ?? null;
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
                    let childRelProperty: any[] = child[reverseRelation.propertyName];
                    if (!Array.isArray(childRelProperty)) {
                        childRelProperty = child[reverseRelation.propertyName as string] = [];
                    }
                    childRelProperty.push(data);
                }
                else {
                    child[reverseRelation.propertyName as string] = data;
                }
            }
        }

        if (entry) {
            entry.enableTrackChanges = true;
            // emit after load event
            if (dbEventEmitter) {
                dbEventEmitter.emitAfterLoadEvent(entry);
            }
        }

        return data;
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
        const generator: ParserFunction<T> = function* (dbContext: DbContext, parseMap: Map<SelectExpression, ParserFunction>, id?: Record<string, ValueType>) {
            const idKey = isNull(id) ? "" : getRelationKey(id, Object.keys(id));
            if (Array.isArray(groupedDataMap[idKey])) {
                for (const res of groupedDataMap[idKey]) {
                    yield res;
                }
            }
            const dbSet = dbContext.set(context.selectExp.itemType as unknown as IObjectType<T & TE>);
            let dbEventEmitter: DBEventEmitter<T & TE>;
            if (dbSet) {
                dbEventEmitter = new DBEventEmitter<T & TE>(dbSet.metaData, dbContext);
            }

            if (Array.isArray(groupedRawMap[idKey])) {
                const rawRows = groupedRawMap[idKey];
                groupedRawMap[idKey] = undefined;
                for (const row of rawRows) {
                    const item: T = context.parseRow(row, dbContext, dbSet, dbEventEmitter, parseMap);
                    const groupId = getRelationKey(row, isNull(id) ? [] : Object.keys(id));
                    let groupDatas: T[] = groupedDataMap[groupId];
                    if (!Array.isArray(groupDatas)) {
                        groupedDataMap[groupId] = groupDatas = [];
                    }
                    groupDatas.push(item);
                    yield item;
                }
            }

            do {
                if (iterResult?.done) {
                    return;
                }

                if (iterResult) {
                    const row = iterResult.value;
                    let compareResult = 0;
                    if (id) {
                        compareResult = compare(row, id);
                    }
                    if (compareResult === 1) {
                        return;
                    }
                    if (compareResult === -1) {
                        const groupId = getRelationKey(row, isNull(id) ? [] : Object.keys(id));
                        let groupDatas: any[] = groupedRawMap[groupId];
                        if (!Array.isArray(groupDatas)) {
                            groupedRawMap[groupId] = groupDatas = [];
                        }
                        groupDatas.push(row);
                    }
                    else if (compareResult === 0) {
                        const item: T = context.parseRow(row, dbContext, dbSet, dbEventEmitter, parseMap);
                        const groupId = getRelationKey(row, isNull(id) ? [] : Object.keys(id));
                        let groupDatas: T[] = groupedDataMap[groupId];
                        if (!Array.isArray(groupDatas)) {
                            groupedDataMap[groupId] = groupDatas = [];
                        }
                        groupDatas.push(item);
                        yield item;
                    }
                }

                iterResult = source.next();
            } while (true);
        };

        return generator;
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

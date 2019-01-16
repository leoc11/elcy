import "../../Extensions/QueryableExtension";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { DbContext } from "../../Data/DBContext";
import { IQueryResultParser } from "./IQueryResultParser";
import { IQueryResult } from "../IQueryResult";
import { IObjectType } from "../../Common/Type";
import { hashCode, isValueType } from "../../Helper/Util";
import { EntityEntry } from "../../Data/EntityEntry";
import { DBEventEmitter } from "../../Data/Event/DbEventEmitter";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { QueryBuilder } from "../QueryBuilder";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { GroupedExpression } from "../../Queryable/QueryExpression/GroupedExpression";
import { IGroupArray } from "../Interface/IGroupArray";
import { DbSet } from "../../Data/DbSet";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { RelationDataMetaData } from "../../MetaData/Relation/RelationDataMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { EntityState } from "../../Data/EntityState";

interface IResolvedRelationData<T = any, TData = any> {
    data?: IResolvedRelationData<TData>;
    entity: T;
    entry?: EntityEntry<T>;
}
interface IResolveData<T = any> {
    primaryColumns?: Iterable<IColumnExpression<T>>;
    columns?: IColumnExpression<T>[];
    isValueType: boolean;
    dbSet?: DbSet<T>;
    column?: IColumnExpression<T>;
    reverseRelationMap?: Map<any, any>;
}

interface IResolveMap extends Map<SelectExpression, Map<number, IResolvedRelationData | IResolvedRelationData[]>> { }

export class POJOQueryResultParser<T> implements IQueryResultParser<T> {
    private _orderedSelects: SelectExpression[];
    private _cache = new Map<SelectExpression, IResolveData>();
    public get orderedSelects() {
        if (!this._orderedSelects) {
            this._orderedSelects = [this.queryExpression];
            for (let i = this._orderedSelects.length - 1; i >= 0; i--) {
                const select = this._orderedSelects[i];
                const addition = Enumerable.from(select.resolvedIncludes).select(o => o.child).toArray();
                this._orderedSelects.splice(i, 0, ...addition);
                i += addition.length;
            }
        }
        return this._orderedSelects;
    }
    constructor(public readonly queryExpression: SelectExpression<T>, public readonly queryBuilder: QueryBuilder) {
    }
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[] {
        return this.parseData(queryResults, dbContext);
    }
    private parseData<T>(queryResults: IQueryResult[], dbContext: DbContext): T[] {
        const results: T[] = [];
        const resolveMap: IResolveMap = new Map<SelectExpression, Map<number, IResolvedRelationData | IResolvedRelationData[]>>();
        const loops = this.orderedSelects;

        for (let i = 0, len = loops.length; i < len; i++) {
            const queryResult = queryResults[i];
            if (!queryResult.rows) continue;

            const data = Enumerable.from(queryResult.rows);
            if (!data.any()) continue;

            let select = loops[i];
            const itemMap = new Map<number, IResolvedRelationData | IResolvedRelationData[]>();
            resolveMap.set(select, itemMap);

            let dbEventEmitter: DBEventEmitter<T> = null;
            const isGroup = select instanceof GroupByExpression && !select.isAggregate;
            if (isGroup) {
                select = (select as GroupByExpression).itemSelect;
            }

            let resolveCache = this.getResolveData(select, dbContext);
            if (resolveCache.dbSet) {
                dbEventEmitter = new DBEventEmitter<T>(resolveCache.dbSet.metaData as IDBEventListener<T>, dbContext);
            }
            const isResult = i === len - 1;
            for (const row of queryResult.rows) {
                const entity = this.parseEntity(select, row, resolveCache, resolveMap, dbContext, itemMap, dbEventEmitter);

                if (isResult) {
                    if (isGroup) {
                        results.add(entity);
                    }
                    else {
                        results.push(entity);
                    }
                }
            }
        }

        return results;
    }
    private getResolveData<T>(select: SelectExpression<T>, dbContext: DbContext) {
        let resolveCache = this._cache.get(select);
        if (!resolveCache) {
            resolveCache = {
                dbSet: dbContext.set<T>(select.itemType as IObjectType<T>),
                isValueType: isValueType(select.itemType)
            };
            if (resolveCache.isValueType) {
                resolveCache.column = select.selects.first();
            }
            else {
                let primaryColumns = select.entity.primaryColumns.where(o => o.columnName !== "__index");
                if (resolveCache.dbSet) {
                    primaryColumns = primaryColumns.union(select.resolvedSelects.where(o => resolveCache.dbSet.primaryKeys.any(c => c.propertyName === o.propertyName)));
                }
                primaryColumns.enableCache = true;
                resolveCache.primaryColumns = primaryColumns;
                resolveCache.columns = select.selects;

                if (select.entity instanceof EntityExpression && select.entity.metaData) {
                    const metaData = select.entity.metaData;
                    if (!(metaData instanceof RelationDataMetaData)) {
                        resolveCache.reverseRelationMap = new Map();
                        for (const include of select.includes) {
                            const relationMeta = metaData.relations.first(o => o.propertyName === include.name);
                            let reverseRelation: IRelationMetaData;
                            if (relationMeta) {
                                reverseRelation = relationMeta.reverseRelation;
                            }
                            resolveCache.reverseRelationMap.set(include, reverseRelation);
                        }
                    }
                }
            }
        }

        return resolveCache;
    }
    private parseEntity<T>(select: SelectExpression<T>, row: any, resolveCache: IResolveData<T>, resolveMap: IResolveMap, dbContext?: DbContext, itemMap?: Map<number, IResolvedRelationData | IResolvedRelationData[]>, dbEventEmitter?: DBEventEmitter<T>) {
        let entity: any;
        let entry: EntityEntry<T>;

        const parentRelation = select.parentRelation as IncludeRelation;
        const reverseRelationMap = resolveCache.reverseRelationMap;
        const dbSet = resolveCache.dbSet;
        if (resolveCache.isValueType) {
            const column = resolveCache.column;
            entity = this.getColumnValue(column, row, dbContext);
        }
        else {
            entity = new (select.itemType as IObjectType)();
            // load existing entity
            if (dbSet) {
                for (const primaryCol of resolveCache.primaryColumns) {
                    this.setColumnValue(entity, primaryCol, row, dbContext);
                }

                entry = dbSet.entry(entity);
                if (entry.state === EntityState.Detached) {
                    entry.state = EntityState.Unchanged;
                }
                else {
                    entity = entry.entity;
                }
            }

            for (const column of resolveCache.columns) {
                this.setColumnValue(entry || entity, column, row, dbContext);
            }
        }

        let relationData: IResolvedRelationData = {
            entity: entity,
            entry: entry
        };
        for (const include of select.includes) {
            if (include.isEmbedded) {
                const childResolveCache = this.getResolveData(include.child, dbContext);
                const child = this.parseEntity(include.child, row, childResolveCache, resolveMap, dbContext);
                entity[include.name] = child;
            }
            else {
                const relationValue = this.parseInclude(include, row, resolveMap);
                if (include.type === "many") {
                    if (!entity[include.name]) {
                        entity[include.name] = [];
                    }

                    let relationMeta: IRelationMetaData<T>;
                    if (include.child.entity.isRelationData) {
                        relationMeta = dbSet ? dbSet.metaData.relations.first(o => o.propertyName === include.name) : null;
                    }
                    for (const data of relationValue) {
                        entity[include.name].push(data.entity);
                        if (relationMeta) {
                            const relationEntry = entry.getRelation(relationMeta.fullName, data.entry);
                            relationEntry.relationData = data.data.entity;
                        }
                    }
                }
                else {
                    const relVal = relationValue.first();
                    if (relVal) {
                        entity[include.name] = relVal.entity;
                        if (select.entity.isRelationData && include.name === parentRelation.name) {
                            relVal.data = relationData;
                            relationData = relVal;
                        }
                    }
                    else {
                        entity[include.name] = null;
                    }
                }

                if (dbSet) {
                    const reverseRelation = reverseRelationMap.get(include);
                    if (reverseRelation) {
                        let childEntities = Array.isArray(relationValue) ? relationValue : [relationValue];
                        for (const child of childEntities) {
                            if (reverseRelation.relationType === "many") {
                                let entityPropValues: any[] = child.entity[reverseRelation.propertyName];
                                if (!entityPropValues) {
                                    child.entity[reverseRelation.propertyName] = [];
                                    // needed coz array is converted to ObservableArray and get new reference.
                                    entityPropValues = child.entity[reverseRelation.propertyName];
                                }
                                entityPropValues.push(entity);
                            }
                            else {
                                child.entity[reverseRelation.propertyName] = entity;
                            }
                        }
                    }
                }
            }
        }

        if (itemMap && parentRelation) {
            let key: number = 0;
            for (const [parentCol, childCol] of parentRelation.relationMap()) {
                key = hashCode(parentCol.propertyName + ":" + this.getColumnValue(childCol, row, dbContext), key);
            }
            if (parentRelation.type === "many") {
                let values = itemMap.get(key) as IResolvedRelationData[];
                if (!values) {
                    values = [];
                    itemMap.set(key, values);
                }
                values.push(relationData);
            }
            else {
                itemMap.set(key, relationData);
            }
        }

        // emit after load event
        if (dbEventEmitter) dbEventEmitter.emitAfterLoadEvent(entity);

        if (select instanceof GroupedExpression && !select.groupByExp.isAggregate) {
            let groupMap = resolveMap.get(select.groupByExp);
            if (!groupMap) {
                groupMap = new Map<number, IResolvedRelationData | IResolvedRelationData[]>();
                resolveMap.set(select.groupByExp, groupMap);
            }

            const groupExp = select as GroupedExpression;
            let key: number = 0;
            for (const groupCol of groupExp.groupBy) {
                key = hashCode(groupCol.propertyName + ":" + row[groupCol.dataPropertyName], key);
            }

            let groupData = groupMap.get(key) as IResolvedRelationData;
            if (!groupData) {
                const groupEntity: IGroupArray<any, any> = [] as any;
                groupData = { entity: groupEntity };
                groupMap.set(key, groupData);

                const keyExp = groupExp.key;
                if (groupExp.groupByExp.keyRelation) {
                    const keyRel = groupExp.groupByExp.keyRelation;
                    if (keyRel.isEmbedded) {
                        const childResolveCache = this.getResolveData(keyRel.child, dbContext);
                        const child = this.parseEntity(keyRel.child, row, childResolveCache, resolveMap, dbContext);
                        groupEntity[keyRel.name] = child;
                    }
                    else {
                        let childMap = resolveMap.get(keyRel.child);
                        if (!childMap) {
                            childMap = new Map();
                            resolveMap.set(keyRel.child, childMap);
                        }

                        const relValue = this.parseInclude(keyRel, row, resolveMap);
                        groupEntity.key = relValue.first().entity;
                    }
                }
                else if ((keyExp as IColumnExpression).entity) {
                    const columnExp = keyExp as IColumnExpression;
                    groupEntity.key = this.getColumnValue(columnExp, row, dbContext);
                }
            }

            const groupEntity = groupData.entity as IGroupArray<any, any>;
            groupEntity.push(entity);
            relationData = groupData;
            entity = groupEntity;
        }

        return entity;
    }
    private parseInclude<T>(include: IncludeRelation<T>, row: any, resolveMap: IResolveMap) {
        const childMap = resolveMap.get(include.child);
        let key: number = 0;
        for (const col of include.parentColumns) {
            key = hashCode(col.propertyName + ":" + this.getColumnValue(col, row), key);
        }
        let relationValue = childMap.get(key);

        // Default many relation value is an empty Array.
        if (include.type === "many" && !relationValue) {
            relationValue = [];
        }

        if (include.type === "many") {
            return relationValue as IResolvedRelationData[];
        }
        else {
            const results: IResolvedRelationData[] = [];
            if (relationValue) results.push(relationValue as any);
            return results;
        }
    }
    private getColumnValue<T>(column: IColumnExpression<T>, data: any, dbContext?: DbContext) {
        const columnMeta: IColumnMetaData = column.columnMetaData ? column.columnMetaData : { type: column.type, nullable: column.isNullable };
        return this.queryBuilder.toPropertyValue(data[column.dataPropertyName], columnMeta);
    }
    private setColumnValue<T>(entryOrEntity: EntityEntry<T> | T, column: IColumnExpression<T>, data: any, dbContext?: DbContext) {
        const value = this.getColumnValue(column, data, dbContext);
        let entity: T;
        if (entryOrEntity instanceof EntityEntry) {
            if (isValueType(value)) {
                entryOrEntity.setOriginalValue(column.propertyName, value);
                return;
            }
            else {
                entity = entryOrEntity.entity;
            }
        }
        else {
            entity = entryOrEntity;
        }

        entity[column.propertyName] = value;
    }
}

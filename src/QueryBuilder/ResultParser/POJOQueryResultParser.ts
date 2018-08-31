import "../../Extensions/QueryableExtension";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { DbContext } from "../../Data/DBContext";
import { IQueryResultParser } from "./IQueryResultParser";
import { IQueryResult } from "../IQueryResult";
import { TimeSpan } from "../../Data/TimeSpan";
import { GenericType, RelationshipType, TimeZoneHandling } from "../../Common/Type";
import { hashCode, isValue } from "../../Helper/Util";
import { relationMetaKey } from "../../Decorator/DecoratorKey";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { EntityEntry } from "../../Data/EntityEntry";
import { DBEventEmitter } from "../../Data/Event/DbEventEmitter";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { RelationDataExpression } from "../../Queryable/QueryExpression/RelationDataExpression";
import { EmbeddedColumnExpression } from "../../Queryable/QueryExpression/EmbeddedColumnExpression";
import { SelectExpression, IIncludeRelation } from "../../Queryable/QueryExpression/SelectExpression";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { UUID } from "../../Data/UUID";
import { Enumerable } from "../../Enumerable/Enumerable";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";

interface IRelationResolveData<T = any, TE = any> {
    resultMap: Map<number, TE>;
    relationMeta?: RelationMetaData<T, TE>;
    type: RelationshipType;
}
export class POJOQueryResultParser<T> implements IQueryResultParser<T> {
    constructor(protected readonly queryExpression: SelectExpression<T>) {

    }
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[] {
        return this.parseData(queryResults, dbContext, this.queryExpression, new Date());
    }
    private parseData<T>(queryResults: IQueryResult[], dbContext: DbContext, select: SelectExpression<T>, loadTime: Date, customTypeMap = new Map<GenericType, Map<number, any>>()): T[] {
        const results: T[] = [];
        let queryResult = queryResults.shift();
        if (Enumerable.load(queryResult.rows).count() <= 0)
            return results;

        // parent relation
        let parentRelation: IRelationResolveData<T, any>;
        if (select.parentRelation) {
            const relation = select.parentRelation as IIncludeRelation<any, T>;
            if (relation.type === "many") {
                parentRelation = {
                    resultMap: customTypeMap.get(relation.parent.itemType),
                    relationMeta: Reflect.getOwnMetadata(relationMetaKey, relation.parent.itemType, relation.name),
                    type: relation.type
                };
            }
        }

        // child relation
        const childRelations = new Map<IIncludeRelation<T, any>, IRelationResolveData>();
        for (const include of select.includes) {
            if (include.type === "one") {
                this.parseData(queryResults, dbContext, include.child, loadTime, customTypeMap);
                const childRelation: IRelationResolveData = {
                    resultMap: customTypeMap.get(include.child.itemType),
                    relationMeta: Reflect.getOwnMetadata(relationMetaKey, select.itemType, include.name),
                    type: include.type
                };
                childRelations.set(include, childRelation);
            }
        }

        let resultMap = customTypeMap.get(select.itemType);
        if (!resultMap) {
            resultMap = new Map<any, any>();
            customTypeMap.set(select.itemType, resultMap);
        }

        const dbSet = dbContext.set<T>(select.itemType as any);
        const primaryColumns = select instanceof GroupByExpression ? select.groupBy : select.projectedColumns.where(o => o.isPrimary);
        const columns = select.selects.where(o => !o.isPrimary);
        const relColumns = select.relationColumns.except(select.selects);

        const dbEventEmitter = dbSet ? new DBEventEmitter<T>(dbSet.metaData as IDBEventListener<T>, dbContext) : undefined;
        const isRelationData = select.entity instanceof RelationDataExpression;

        for (const row of queryResult.rows) {
            let entity = new (select.itemType as any)();
            let entry: EntityEntry<T>;
            const keyData: { [key: string]: any } = {};
            for (const primaryCol of primaryColumns) {
                const columnName = primaryCol.columnName;
                const prop = primaryCol.propertyName;
                const value = this.convertTo(row[columnName], primaryCol);
                this.setDeepProperty(keyData, prop, value);
                if (select.entity === select.itemExpression || select.selects.contains(primaryCol))
                    this.setDeepProperty(entity, prop, value);
            }
            const key = hashCode(JSON.stringify(keyData));

            // load existing entity
            if (dbSet) {
                entry = dbSet.entry(row);
                if (entry)
                    entity = entry.entity;
                else
                    entry = dbSet.attach(entity);
            }
            resultMap.set(key, entity);

            // set all entity value
            let isValueEntity = Array.isArray(entity);
            if (isValue(entity)) {
                isValueEntity = true;
                const column = select.selects.first();
                entity = this.convertTo(row[column.columnName], column);
            }
            else {
                for (const column of columns) {
                    this.setPropertyValue(entry || entity, column, row, dbContext);
                }
            }
            for (const column of relColumns) {
                const value = this.convertTo(row[column.columnName], column);
                this.setDeepProperty(keyData, column.propertyName, value);
            }
            results.push(entity);

            if (isRelationData) {
                const relationDataMeta = parentRelation.relationMeta.relationData;
                let a: any = {};
                for (const [sourceColMeta, relColMeta] of relationDataMeta.sourceRelationMaps) {
                    let value = this.getDeepProperty(keyData, relColMeta.propertyName);
                    if (value === undefined)
                        value = this.getDeepProperty(entity, relColMeta.propertyName);

                    this.setDeepProperty(a, sourceColMeta.propertyName, value);
                }
                let key = hashCode(JSON.stringify(a));
                const sourceEntity = customTypeMap.get(relationDataMeta.source.type).get(key);

                a = {};
                for (const [relColMeta, targetColMeta] of relationDataMeta.targetRelationMaps) {
                    let value = this.getDeepProperty(keyData, relColMeta.propertyName);
                    if (value === undefined)
                        value = this.getDeepProperty(entity, relColMeta.propertyName);

                    this.setDeepProperty(a, targetColMeta.propertyName, value);
                }
                key = hashCode(JSON.stringify(a));
                const targetEntity = customTypeMap.get(relationDataMeta.target.type).get(key);
                Reflect.setRelationData(sourceEntity, relationDataMeta.sourceRelationMeta.propertyName, targetEntity, entity);

                if (relationDataMeta.completeRelationType === "many-many") {
                    if (!sourceEntity[relationDataMeta.sourceRelationMeta.propertyName])
                        sourceEntity[relationDataMeta.sourceRelationMeta.propertyName] = [];
                    sourceEntity[relationDataMeta.sourceRelationMeta.propertyName].push(targetEntity);
                    if (!targetEntity[relationDataMeta.targetRelationMeta.propertyName])
                        targetEntity[relationDataMeta.targetRelationMeta.propertyName] = [];
                    targetEntity[relationDataMeta.targetRelationMeta.propertyName].push(sourceEntity);
                }
                continue;
            }

            // resolve parent relation
            if (parentRelation) {
                const relation = select.parentRelation as IIncludeRelation<any, any>;
                const a: any = {};
                for (const [parentCol, childCol] of relation.relations) {
                    let value = this.getDeepProperty(keyData, childCol.propertyName);
                    if (value === undefined)
                        value = this.getDeepProperty(entity, childCol.propertyName);

                    this.setDeepProperty(a, parentCol.propertyName, value);
                }
                const key = hashCode(JSON.stringify(a));
                const parentEntity = parentRelation.resultMap.get(key);
                if (parentRelation.relationMeta && parentRelation.relationMeta.reverseRelation) {
                    entity[parentRelation.relationMeta.reverseRelation.propertyName] = parentEntity;
                }
                if (parentEntity) {
                    if (parentRelation.type === "many") {
                        if (Array.isArray(parentEntity))
                            parentEntity.add(entity);
                        else {
                            this.getDeepProperty<any[]>(parentEntity, relation.name).add(entity);
                        }
                    }
                    else {
                        this.setDeepProperty(parentEntity, relation.name, entity);
                    }
                }
            }

            // resolve child relation
            for (const [include, data] of childRelations) {
                const a: any = {};
                for (const [parentCol, childCol] of include.relations) {
                    let value = this.getDeepProperty(keyData, parentCol.propertyName);
                    if (value === undefined)
                        value = this.getDeepProperty(entity, parentCol.propertyName);

                    this.setDeepProperty(a, childCol.propertyName, value);
                }
                const key = hashCode(JSON.stringify(a));
                const childEntity = data.resultMap.get(key);
                this.setDeepProperty(entity, include.name, childEntity);
                if (childEntity && data.relationMeta && data.relationMeta.reverseRelation) {
                    if (data.relationMeta.reverseRelation.relationType === "many") {
                        if (!childEntity[data.relationMeta.reverseRelation.propertyName]) {
                            childEntity[data.relationMeta.reverseRelation.propertyName] = [];
                        }
                        childEntity[data.relationMeta.reverseRelation.propertyName].add(entity);
                    }
                    else {
                        childEntity[data.relationMeta.reverseRelation.propertyName] = entity;
                    }
                }
            }

            // set relation to Array
            if (!isValueEntity) {
                for (const include of select.includes) {
                    if (include.type === "many") {
                        if (!this.getDeepProperty(entity, include.name)) {
                            this.setDeepProperty(entity, include.name, []);
                        }
                    }
                }
            }

            // emit after load event
            if (dbEventEmitter) {
                dbEventEmitter.emitAfterLoadEvent(entity);
            }
        }

        if (!isRelationData) {
            for (const include of select.includes) {
                if (include.type === "many")
                    this.parseData(queryResults, dbContext, include.child, loadTime, customTypeMap);
            }
        }
        return results;
    }
    private setPropertyValue<T>(entryOrEntity: EntityEntry<T> | T, column: IColumnExpression<T>, data: any, dbContext: DbContext) {
        if (column instanceof EmbeddedColumnExpression) {
            const entity = (entryOrEntity instanceof EntityEntry ? entryOrEntity.entity : entryOrEntity);
            let entityEntry: EntityEntry;
            if (entryOrEntity instanceof EntityEntry)
                entityEntry = entryOrEntity;

            const embeddedColumn = column as EmbeddedColumnExpression<T>;
            let embeddedEntity = entity[embeddedColumn.propertyName];
            if (!embeddedEntity) {
                embeddedEntity = new embeddedColumn.type();
                if (entityEntry) {
                    entityEntry.setOriginalValue(column.propertyName as any, embeddedEntity);
                }
                else {
                    // TODO: possible not used
                    entity[embeddedColumn.propertyName] = embeddedEntity;
                }
            }

            for (const select of column.selects) {
                this.setPropertyValue(embeddedEntity, select, data, dbContext);
            }
            return;
        }

        const value = this.convertTo(data[column.columnName], column);
        if (entryOrEntity instanceof EntityEntry)
            entryOrEntity.setOriginalValue(column.propertyName as any, value);
        else
            this.setDeepProperty(entryOrEntity, column.propertyName, value);
    }
    private setDeepProperty(obj: any, propertyPath: string, value: any) {
        const propertyPathes = propertyPath.split(".");
        const property = propertyPathes.pop();
        for (const path of propertyPathes) {
            if (!obj[path]) {
                obj[path] = {};
            }
            obj = obj[path];
        }
        obj[property] = value;
    }
    private getDeepProperty<T = any>(obj: any, propertyPath: string): T {
        const propertyPathes = propertyPath.split(".");
        const property = propertyPathes.pop();
        for (const path of propertyPathes) {
            if (!obj[path]) {
                return undefined;
            }
            obj = obj[path];
        }
        return obj[property];
    }
    private convertTo<T>(input: any, column: IColumnExpression<T>): any {
        if (Array.isArray(input))
            input = input.pop();

        switch (column.type) {
            case Boolean:
                return Boolean(input);
            case Number:
                let result = Number.parseFloat(input);
                if (isFinite(result))
                    return result;
                else {
                    if (column.columnMetaData && column.columnMetaData.nullable)
                        return null;
                    return 0;
                }
            case String:
                return input ? input.toString() : input;
            case Date: {
                const result = new Date(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof DateTimeColumnMetaData ? column.timeZoneHandling : "none";
                return timeZoneHandling === "none" ? result : new Date(result.getUTCFullYear(), result.getUTCMonth(), result.getUTCDate(), result.getUTCHours(), result.getUTCMinutes(), result.getUTCSeconds(), result.getUTCMilliseconds());
            }
            case TimeSpan: {
                const result = typeof input === "number" ? new TimeSpan(input) : TimeSpan.parse(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof TimeColumnMetaData ? column.timeZoneHandling : "none";
                return timeZoneHandling === "none" ? result : result.addMinutes((new Date(result.totalMilliSeconds())).getTimezoneOffset());
            }
            case UUID: {
                if (input)
                    return new UUID(input.toString());

                if (column.columnMetaData && column.columnMetaData.nullable)
                    return null;
                return UUID.empty;
            }
            default:
                throw new Error(`${column.type.name} not supported`);
        }
    }
}

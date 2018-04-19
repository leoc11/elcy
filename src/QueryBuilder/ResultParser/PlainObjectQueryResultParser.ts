import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { DbContext } from "../../Data/DBContext";
import { EntityBase } from "../../Data/EntityBase";
import { IQueryResultParser } from "./IQueryResultParser";
import { IQueryResult } from "../QueryResult";
import { SelectExpression, IIncludeRelation } from "../../Queryable/QueryExpression";
import { TimeSpan } from "../../Common/TimeSpan";
import { GenericType, RelationType } from "../../Common/Type";
import { hashCode, isValue } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { relationMetaKey } from "../../Decorator/DecoratorKey";

interface IRelationResolveData<T extends EntityBase = any, TE extends EntityBase = any> {
    resultMap: Map<number, TE>;
    relationMeta?: IRelationMetaData<T, TE>;
    reverseRelationMeta?: IRelationMetaData<TE, T>;
    type: RelationType;
}
export class PlainObjectQueryResultParser<T extends EntityBase> implements IQueryResultParser<T> {
    constructor(protected readonly queryExpression: SelectExpression<T>) {

    }
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[] {
        return this.parseData(queryResults, dbContext, this.queryExpression, new Date());
    }
    private parseData<T>(queryResults: IQueryResult[], dbContext: DbContext, select: SelectExpression<T>, loadTime: Date, customTypeMap = new Map<GenericType, Map<number, any>>()): T[] {
        const results: T[] = [];
        const queryResult = queryResults.shift();

        if (queryResult.rows.length <= 0)
            return results;

        // parent relation
        let parentRelation: IRelationResolveData<any, any>;
        if (select.parentRelation) {
            const relation = select.parentRelation as IIncludeRelation<any, T>;
            if (relation.type === RelationType.OneToMany) {
                parentRelation = {
                    resultMap: customTypeMap.get(relation.parent.objectType),
                    relationMeta: Reflect.getOwnMetadata(relationMetaKey, relation.parent.objectType, relation.name),
                    type: relation.type
                };
                if (parentRelation.relationMeta && parentRelation.relationMeta.reverseProperty) {
                    parentRelation.reverseRelationMeta = Reflect.getOwnMetadata(relationMetaKey, select.objectType, parentRelation.relationMeta.reverseProperty);
                }
            }
        }

        // child relation
        const childRelations = new Map<IIncludeRelation<T, any>, IRelationResolveData>();
        for (const include of select.includes) {
            if (include.type === RelationType.OneToOne) {
                this.parseData(queryResults, dbContext, include.child, loadTime, customTypeMap);
                const childRelation: IRelationResolveData = {
                    resultMap: customTypeMap.get(include.child.objectType),
                    relationMeta: Reflect.getOwnMetadata(relationMetaKey, select.objectType, include.name),
                    type: include.type
                };
                if (childRelation.relationMeta && childRelation.relationMeta.reverseProperty)
                    childRelation.reverseRelationMeta = Reflect.getOwnMetadata(relationMetaKey, include.child.objectType, childRelation.relationMeta.reverseProperty);
                childRelations.set(include, childRelation);
            }
        }

        let resultMap = customTypeMap.get(select.objectType);
        if (!resultMap) {
            resultMap = new Map<any, any>();
            customTypeMap.set(select.objectType, resultMap);
        }

        const dbSet = dbContext.set(select.objectType as any);
        const primaryColumns = select.projectedColumns.where(o => o.isPrimary);
        const columns = select.selects.where(o => !o.isPrimary);
        const relColumns = select.relationColumns.except(select.selects);

        for (const row of queryResult.rows) {
            let entity = new (select.objectType as any)();
            const keyData: { [key: string]: any } = {};
            for (const primaryCol of primaryColumns) {
                const columnName = primaryCol.columnName;
                const prop = primaryCol.propertyName;
                keyData[prop] = this.convertTo(row[columnName], primaryCol);
                if (select.selects.contains(primaryCol))
                    entity[prop] = keyData[prop];
            }
            let isSkipPopulateEntityData = false;
            const key = hashCode(JSON.stringify(keyData));
            if (dbSet) {
                const existing = dbSet.entry(row);
                if (existing) {
                    entity = existing.entity;
                    if (existing.loadTime < loadTime)
                        existing.loadTime = loadTime;
                    else
                        isSkipPopulateEntityData = existing.isCompletelyLoaded;
                }
                else {
                    dbSet.attach(entity, loadTime);
                }
            }
            resultMap.set(key, entity);

            let isValueEntity = Array.isArray(entity);
            if (!isSkipPopulateEntityData) {
                if (isValue(entity)) {
                    isValueEntity = true;
                    const column = select.selects.first();
                    entity = this.convertTo(row[column.columnName], column);
                }
                else {
                    for (const column of columns) {
                        entity[column.propertyName] = this.convertTo(row[column.columnName], column);
                    }
                }
            }
            for (const column of relColumns) {
                keyData[column.propertyName] = this.convertTo(row[column.columnName], column);
            }

            // resolve parent relation
            if (parentRelation) {
                const relation = select.parentRelation as IIncludeRelation<any, any>;
                const a: any = {};
                for (const [parentCol, childCol] of relation.relations) {
                    if (entity.hasOwnProperty(parentCol.propertyName))
                        a[childCol.propertyName] = entity[parentCol.propertyName];
                    else
                        a[childCol.propertyName] = keyData[parentCol.propertyName];
                }
                const key = hashCode(JSON.stringify(a));
                const parentEntity = parentRelation.resultMap.get(key);
                if (parentRelation.reverseRelationMeta) {
                    entity[parentRelation.relationMeta.reverseProperty] = parentEntity;
                }
                if (parentEntity) {
                    if (parentRelation.type === RelationType.OneToMany) {
                        (Array.isArray(parentEntity) ? parentEntity : parentEntity[relation.name]).add(entity);
                    }
                    else {
                        parentEntity[relation.name] = entity;
                    }
                }
            }

            // resolve child relation
            for (const [include, data] of childRelations) {
                const a: any = {};
                for (const [parentCol, childCol] of include.relations) {
                    if (entity.hasOwnProperty(parentCol.propertyName))
                        a[childCol.propertyName] = entity[parentCol.propertyName];
                    else
                        a[childCol.propertyName] = keyData[parentCol.propertyName];
                }
                const key = hashCode(JSON.stringify(a));
                const childEntity = data.resultMap.get(key);
                entity[include.name] = childEntity;
                if (childEntity && data.reverseRelationMeta) {
                    if (data.reverseRelationMeta.relationType === RelationType.OneToMany) {
                        if (!childEntity[data.relationMeta.reverseProperty]) {
                            childEntity[data.relationMeta.reverseProperty] = [];
                        }
                        childEntity[data.relationMeta.reverseProperty].add(entity);
                    }
                    else {
                        childEntity[data.relationMeta.reverseProperty] = entity;
                    }
                }
            }

            // set relation to Array
            if (!isValueEntity) {
                for (const include of select.includes) {
                    if (include.type === RelationType.OneToMany) {
                        if (!entity[include.name]) {
                            entity[include.name] = [];
                        }
                    }
                }
            }
            results.push(entity);
        }
        for (const include of select.includes) {
            if (include.type === RelationType.OneToMany)
                this.parseData(queryResults, dbContext, include.child, loadTime, customTypeMap);
        }
        return results;
    }
    private convertTo<T>(input: any, column: IColumnExpression<T>): any {
        switch (column.type) {
            case Boolean:
                return input;
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
                return input ? input : input.toString();
            case Date:
                return new Date(input);
            case TimeSpan:
                return new TimeSpan(Number.parseFloat(input)) as any;
            default:
                throw new Error(`${column.type.name} not supported`);
        }
    }
}

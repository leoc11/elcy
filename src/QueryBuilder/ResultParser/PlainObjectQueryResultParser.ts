import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { DbContext } from "../../Data/DBContext";
import { IQueryResultParser } from "./IQueryResultParser";
import { IQueryResult } from "../QueryResult";
import { SelectExpression, IIncludeRelation, GroupByExpression } from "../../Queryable/QueryExpression";
import { TimeSpan } from "../../Common/TimeSpan";
import { GenericType, RelationshipType } from "../../Common/Type";
import { hashCode, isValue } from "../../Helper/Util";
import { relationMetaKey } from "../../Decorator/DecoratorKey";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";

interface IRelationResolveData<T = any, TE = any> {
    resultMap: Map<number, TE>;
    relationMeta?: RelationMetaData<T, TE>;
    type: RelationshipType;
}
export class PlainObjectQueryResultParser<T> implements IQueryResultParser<T> {
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

        const dbSet = dbContext.set(select.itemType as any);
        const primaryColumns = select instanceof GroupByExpression ? select.groupBy : select.projectedColumns.where(o => o.isPrimary);
        const columns = select.selects.where(o => !o.isPrimary);
        const relColumns = select.relationColumns.except(select.selects);

        for (const row of queryResult.rows) {
            let entity = new (select.itemType as any)();
            const keyData: { [key: string]: any } = {};
            for (const primaryCol of primaryColumns) {
                const columnName = primaryCol.columnName;
                const prop = primaryCol.propertyName;
                const value = this.convertTo(row[columnName], primaryCol);
                this.setDeepProperty(keyData, prop, value);
                if (select.entity === select.itemExpression || select.selects.contains(primaryCol))
                    this.setDeepProperty(entity, prop, value);
            }
            let isSkipPopulateEntityData = false;
            const key = hashCode(JSON.stringify(keyData));
            if (dbSet) {
                const existing = dbSet.entry(row);
                if (existing) {
                    entity = existing.entity;
                    isSkipPopulateEntityData = existing.isCompletelyLoaded;
                }
                else {
                    dbSet.attach(entity);
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
                        const value = this.convertTo(row[column.columnName], column);
                        this.setDeepProperty(entity, column.propertyName, value);
                    }
                }
            }
            for (const column of relColumns) {
                const value = this.convertTo(row[column.columnName], column);
                this.setDeepProperty(keyData, column.propertyName, value);
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
            results.push(entity);
        }
        for (const include of select.includes) {
            if (include.type === "many")
                this.parseData(queryResults, dbContext, include.child, loadTime, customTypeMap);
        }
        return results;
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
                return input ? input.toString() : input;
            case Date:
                return new Date(input);
            case TimeSpan:
                return new TimeSpan(Number.parseFloat(input)) as any;
            default:
                throw new Error(`${column.type.name} not supported`);
        }
    }
}

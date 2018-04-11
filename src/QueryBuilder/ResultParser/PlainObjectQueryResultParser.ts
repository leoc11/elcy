import { IColumnExpression } from "../../Linq/Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Linq/Queryable/QueryExpression/IEntityExpression";
import { DbContext } from "../../Linq/DBContext";
import { EntityBase } from "../../Data/EntityBase";
import { IQueryResultParser } from "./IQueryResultParser";
import { IQueryResult } from "../QueryResult";
import { SelectExpression, IIncludeRelation } from "../../Linq/Queryable/QueryExpression";
import { TimeSpan } from "../../Common/TimeSpan";
import { GenericType, RelationType } from "../../Common/Type";
import { hashCode, isValue } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { relationMetaKey } from "../../Decorator/DecoratorKey";
import { DbSet } from "../../Linq/DbSet";

export class PlainObjectQueryResultParser<T extends EntityBase> implements IQueryResultParser<T> {
    constructor(protected readonly queryExpression: SelectExpression<T>) {

    }
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[] {
        return this.parseData(queryResults, dbContext, this.queryExpression, new Date());
    }
    private parseData<T>(queryResults: IQueryResult[], dbContext: DbContext, select: SelectExpression<T>, loadTime: Date, customTypeMap = new Map<GenericType, Map<number, any>>()): T[] {
        const results: T[] = [];
        const queryResult = queryResults.shift();
        const dbSet = dbContext.set(select.objectType as any);
        const primaryColumns = select.projectedColumns.where(o => o.isPrimary);
        const columns = select.selects.where(o => !o.isPrimary);

        const relation = select.parentRelation as IIncludeRelation<any, T>;
        let parentSet: DbSet<any>;
        let relationMeta: IRelationMetaData<any, any>;
        let reverseRelationMeta: IRelationMetaData<any, any>;

        if (relation && (relation as IIncludeRelation<any, T>).name) {
            relationMeta = Reflect.getOwnMetadata(relationMetaKey, relation.parent.objectType, relation.name);
            if (relationMeta) {
                parentSet = dbContext.set(relation.parent.objectType as any);
                if (relationMeta.reverseProperty)
                    reverseRelationMeta = Reflect.getOwnMetadata(relationMetaKey, select.objectType, relationMeta.reverseProperty);
            }
        }

        for (const row of queryResult.rows) {
            let entity = new (select.objectType as any)();
            const entityKey: { [key: string]: any } = {};
            for (const primaryCol of primaryColumns) {
                const columnName = primaryCol.columnName;
                const prop = primaryCol.propertyName;
                entityKey[prop] = this.convertTo(row[columnName], primaryCol);
                if (select.selects.contains(primaryCol))
                    entity[prop] = entityKey[prop];
            }
            let isSkipPopulateEntityData = false;
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
                    dbSet.attach(entity, { loadTime: loadTime });
                }
            }
            else if (Object.keys(entityKey).length > 0) {
                let existings = customTypeMap.get(select.objectType);
                if (!existings) {
                    existings = new Map<any, any>();
                    customTypeMap.set(select.objectType, existings);
                }

                if (Object.keys(entityKey).length > 0) {
                    const objHash = hashCode(JSON.stringify(entityKey));
                    const existing = existings.get(objHash);
                    if (existing) {
                        entity = existing;
                    }
                    else {
                        existings.set(objHash, entity);
                    }
                }
            }

            if (!isSkipPopulateEntityData) {
                if (isValue(entity)) {
                    const column = select.selects.first();
                    entity = this.convertTo(row[column.columnName], column);
                }
                else {
                    for (const column of columns) {
                        entity[column.propertyName] = this.convertTo(row[column.columnName], column);
                    }
                }

                // set navigation property
                if (relationMeta) {
                    let parentEntity: any = null;
                    if (parentSet) {
                        const a: any = {};
                        for (const [parentCol, childCol] of relation.relations) {
                            a[parentCol.propertyName] = entity[childCol.propertyName];
                        }
                        parentEntity = parentSet.findLocal(a);
                    }
                    if (parentEntity) {
                        if (relationMeta.relationType === RelationType.OneToOne) {
                            parentEntity[relation.name as any] = entity;
                        }
                        else {
                            if (!parentEntity[relation.name]) {
                                parentEntity[relation.name] = [];
                            }
                            parentEntity[relation.name].add(entity);
                        }
                    }
                    if (reverseRelationMeta) {
                        if (reverseRelationMeta.relationType === RelationType.OneToOne) {
                            entity[relationMeta.reverseProperty] = parentEntity;
                        }
                        else {
                            if (!entity[relationMeta.reverseProperty]) {
                                entity[relationMeta.reverseProperty] = [];
                            }
                            if (parentEntity)
                                entity[relationMeta.reverseProperty].add(parentEntity);
                        }
                    }
                }
            }
            results.push(entity);
        }
        for (const include of select.includes) {
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
                return input;
            case Date:
                return new Date(input);
            case TimeSpan:
                return new TimeSpan(Number.parseFloat(input)) as any;
            default:
                throw new Error(`${column.type.name} not supported`);
        }
    }
}

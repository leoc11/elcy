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
import { MasterRelationMetaData } from "../../MetaData/Relation";

export interface IColumnParserData<T = any> {
    column: IColumnExpression<T>;
    index: number;
}
export interface IGroupedColumnParser {
    entity: IEntityExpression;
    primaryColumns: IColumnParserData[];
    columns: IColumnParserData[];
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
        const dbSet = dbContext.set(select.objectType as any);
        const primaryColumns = select.selects.where(o => o.isPrimary);
        const columns = select.selects.where(o => !o.isPrimary);
        for (const row of queryResult.rows) {
            let entity = new (select.objectType as any)();
            const entityKey: { [key: string]: any } = {};
            for (const primaryCol of primaryColumns) {
                const columnName = primaryCol.alias ? primaryCol.alias : primaryCol.columnName;
                const prop = primaryCol.alias ? primaryCol.alias : primaryCol.propertyName;
                entityKey[prop] = this.convertTo(row[columnName], primaryCol);
                if (!primaryCol.isShadow)
                    entity[prop] = entityKey[prop];
            }
            let isSkipPopulateEntityData = false;
            if (dbSet) {
                const existing = dbSet.entry(row);
                if (existing) {
                    entity = existing.entity;
                    if (existing.loadTime < loadTime) {
                        existing.loadTime = loadTime;
                    }
                    else
                        isSkipPopulateEntityData = existing.isCompletelyLoaded;
                }
                else {
                    dbSet.attach(entity, { loadTime: loadTime, isCompletelyLoaded: select.selects.length >= select.entity.columns.length });
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
                    const existing = existings ? existings.get(objHash) : undefined;
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
                    const column = select.selects.first(o => !o.isShadow);
                    const columnName = column.alias ? column.alias : column.columnName;
                    entity = this.convertTo(row[columnName], column);
                }
                else {
                    for (const column of columns) {
                        const columnName = column.alias ? column.alias : column.columnName;
                        const prop = column.alias ? column.alias : column.propertyName;
                        entity[prop] = this.convertTo(row[columnName], column);
                    }
                }
                if (select.parentRelation && (select.parentRelation as IIncludeRelation<any, T>).name) {
                    const relation = select.parentRelation as IIncludeRelation<any, T>;
                    let relationMeta: IRelationMetaData<any, any> = select.entity.type !== Object ? Reflect.getOwnMetadata(relationMetaKey, relation.parent.objectType, relation.name) : undefined;
                    if (relationMeta && relationMeta.reverseProperty) {
                        const parentSet = dbContext.set(relation.parent.objectType as any);
                        let parentEntity: any = null;
                        if (parentSet) {
                            const a: any = {};
                            for (const [parentCol, childCol] of relation.relations) {
                                a[parentCol.propertyName] = entity[childCol.propertyName];
                            }
                            parentEntity = parentSet.findLocal(a);
                        }
                        if (parentEntity != null) {
                            if (relationMeta.relationType === RelationType.OneToOne) {
                                (parentEntity as any)[relation.name as any] = entity;
                            }
                            else {
                                if (!parentEntity[relation.name]) {
                                    parentEntity[relation.name] = [];
                                }
                                parentEntity[relation.name].add(entity);
                            }
                            const reverseRelationMeta = Reflect.getOwnMetadata(relationMetaKey, entity.constructor, relationMeta.reverseProperty);
                            if (reverseRelationMeta) {
                                if (reverseRelationMeta.relationType === RelationType.OneToOne) {
                                    entity[relationMeta.reverseProperty] = parentEntity;
                                }
                                else {
                                    if (!entity[relationMeta.reverseProperty]) {
                                        entity[relationMeta.reverseProperty] = [];
                                    }
                                    entity[relationMeta.reverseProperty].add(parentEntity);
                                }
                            }
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
    private convertTo<T>(input: string, column: IColumnExpression<T>): T {
        switch (column.type) {
            case Boolean:
                return (input === "1") as any;
            case Number:
                return Number.parseFloat(input) as any;
            case String:
                return input as any;
            case Date:
                return new Date(input) as any;
            case TimeSpan:
                return new TimeSpan(Number.parseFloat(input)) as any;
            default:
                throw new Error(`${column.type.name} not supported`);
        }
    }
}

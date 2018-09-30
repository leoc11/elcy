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
import { EmbeddedColumnExpression } from "../../Queryable/QueryExpression/EmbeddedColumnExpression";
import { SelectExpression, IIncludeRelation } from "../../Queryable/QueryExpression/SelectExpression";
import { Enumerable } from "../../Enumerable/Enumerable";
import { QueryBuilder } from "../QueryBuilder";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";

interface IResolvedRelationData<T = any, TData = any> {
    data?: IResolvedRelationData<TData>;
    entity: T;
    entry?: EntityEntry<T>;
}

export class POJOQueryResultParser<T> implements IQueryResultParser<T> {
    private _orderedSelects: SelectExpression[];
    public get orderedSelects() {
        if (!this._orderedSelects) {
            this._orderedSelects = [this.queryExpression];
            for (let i = 0; i < this._orderedSelects.length; i++) {
                const select = this._orderedSelects[i];
                this._orderedSelects.splice(i + 1, 0, ...select.includes.select(o => o.child).toArray());
            }
        }
        return this._orderedSelects;
    }
    constructor(public readonly queryExpression: SelectExpression<T>, public readonly queryBuilder: QueryBuilder) {
    }
    parse(queryResults: IQueryResult[], dbContext: DbContext): T[] {
        return this.parseData(queryResults, dbContext, new Date());
    }
    private parseData<T>(queryResults: IQueryResult[], dbContext: DbContext, loadTime: Date): T[] {
        const results: T[] = [];
        const resolveMap = new Map<SelectExpression, Map<number, IResolvedRelationData | IResolvedRelationData[]>>();
        const loops = this.orderedSelects;

        for (let i = loops.length - 1; i >= 0; i--) {
            const queryResult = queryResults[i];
            const select = loops[i];
            resolveMap.set(select, new Map());
            const itemMap = new Map<number, IResolvedRelationData | IResolvedRelationData[]>();
            resolveMap.set(select, itemMap);

            if (Enumerable.load(queryResult.rows).count() <= 0)
                continue;

            const dbSet = dbContext.set<T>(select.itemType as IObjectType);
            const dbEventEmitter = dbSet ? new DBEventEmitter<T>(dbSet.metaData as IDBEventListener<T>, dbContext) : undefined;

            let primaryColumns = (dbSet ? select.projectedColumns : select.selects).where(o => o.isPrimary);
            const columns = select.selects.except(primaryColumns);
            const parentRelation = select.parentRelation as IIncludeRelation;

            let reverseRelationMap = new Map<IIncludeRelation, IRelationMetaData>();
            for (const row of queryResult.rows) {
                let entity: any;
                let entry: EntityEntry<T>;

                if (isValueType(select.itemType)) {
                    const column = select.selects.first();
                    const columnName = column.alias ? column.alias : column.columnName;
                    entity = this.queryBuilder.toPropertyValue(row[columnName], column);
                }
                else {
                    if (select.itemType === Array) {
                        entity = [];
                    }
                    else {
                        entity = new (select.itemType as IObjectType)();
                    }
                    for (const primaryCol of primaryColumns) {
                        this.setPropertyValue(entity, primaryCol, row, dbContext);
                    }

                    // load existing entity
                    if (dbSet) {
                        entry = dbSet.entry(entity);
                        if (entry)
                            entity = entry.entity;
                        else
                            entry = dbSet.attach(entity);
                    }

                    for (const column of columns) {
                        this.setPropertyValue(entry || entity, column, row, dbContext);
                    }
                }

                let relationData: IResolvedRelationData = {
                    entity: entity,
                    entry: entry
                };
                for (const include of select.includes) {
                    const childMap = resolveMap.get(include.child);
                    const relKey: any = {};
                    for (const key of include.relationMap.keys()) {
                        relKey[key.propertyName] = row[key.columnName];
                    }
                    const key = hashCode(JSON.stringify(relKey));
                    let relationValue = childMap.get(key);

                    // Default many relation value is an empty Array.
                    if (include.type === "many" && !relationValue) {
                        relationValue = [];
                    }

                    if (select.entity.isRelationData && include.name === parentRelation.name) {
                        const childRelationData = relationValue as IResolvedRelationData;
                        childRelationData.data = relationData;
                        relationData = childRelationData;
                    }
                    else if (include.child.entity.isRelationData) {
                        let values = this.getDeepProperty<any[]>(entity, include.name);
                        if (!values) {
                            this.setDeepProperty(entity, include.name, []);
                            values = this.getDeepProperty<any[]>(entity, include.name);
                        }

                        const relDatas = relationValue as IResolvedRelationData[];
                        const relationMeta = dbSet ? dbSet.metaData.relations.first(o => o.propertyName === include.name) : null;
                        relDatas.each(o => {
                            values.push(o.entity);
                            if (relationMeta) {
                                const relationEntry = entry.getRelation(relationMeta.fullName, o.entry);
                                relationEntry.relationData = o.data.entity;
                            }
                        });
                    }
                    else if (include.type === "many") {
                        const relatedValues = relationValue as IResolvedRelationData[];
                        const relatedEntities = relatedValues.select(o => o.entity).toArray();
                        let valueArray: any[];
                        if (Array.isArray(entity) && include.name === "") {
                            valueArray = entity;
                        }
                        else {
                            valueArray = this.getDeepProperty(entity, include.name);
                            if (!valueArray) {
                                this.setDeepProperty(entity, include.name, []);
                                valueArray = this.getDeepProperty(entity, include.name);
                            }
                        }
                        valueArray.push(...relatedEntities);
                    }
                    else {
                        const related = relationValue as IResolvedRelationData;
                        this.setDeepProperty(entity, include.name, related.entity);
                    }

                    if (dbSet) {
                        if (!reverseRelationMap.has(include)) {
                            const relationMeta = dbSet.metaData.relations.first(o => o.propertyName === include.name);
                            let reverseRelation: IRelationMetaData;
                            if (relationMeta) {
                                reverseRelation = relationMeta.reverseRelation;
                            }
                            reverseRelationMap.set(include, reverseRelation);
                        }
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

                if (parentRelation) {
                    const relKey: any = {};
                    for (const [parentCol, childCol] of parentRelation.relationMap) {
                        relKey[parentCol.propertyName] = row[childCol.columnName];
                    }
                    const key = hashCode(JSON.stringify(relKey));
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
                else {
                    results.push(entity);
                }

                // emit after load event
                if (dbEventEmitter) {
                    dbEventEmitter.emitAfterLoadEvent(entity);
                }
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

        const columnName = column.alias ? column.alias : column.columnName;
        const value = this.queryBuilder.toPropertyValue(data[columnName], column);
        if (entryOrEntity instanceof EntityEntry) {
            if (column.propertyName.indexOf(".") >= 0)
                this.setDeepProperty(entryOrEntity.entity, column.propertyName, value);
            else
                entryOrEntity.setOriginalValue(column.propertyName as any, value);
        }
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
}

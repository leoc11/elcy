import { IQueryResultParser } from "./IQueryResultParser";
import { IColumnExpression } from "../../Linq/Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Linq/Queryable/QueryExpression/IEntityExpression";
import { DbContext } from "../../Linq/DBContext";
import { relationMetaKey } from "../../Decorator/DecoratorKey";
import { IRelationMetaData } from "../../MetaData/Interface/index";
import { GenericType, RelationType } from "../../Common/Type";
import { isValue } from "../../Helper/Util";

export interface IGroupedColumnParser {
    entity: IEntityExpression;
    primaryColumns: IColumnExpression[];
    columns: IColumnExpression[];
    isCustomObject: boolean;
}
export class ArrayQueryResultParser<T> implements IQueryResultParser<T> {
    protected get groupedColumns(): IGroupedColumnParser[] {
        if (!this._groupedColumns) {
            this._groupedColumns = this.columns.groupBy((o) => o.entity).select((o) => ({
                entity: o.key,
                primaryColumns: o.where((c) => c.isPrimary).toArray(),
                columns: o.where((c) => !c.isPrimary && !c.isShadow).toArray(),
                isCustomObject: o.any((c) => !!c.alias)
            })).toArray();
        }
        return this._groupedColumns;
    }
    private _groupedColumns: IGroupedColumnParser[];
    constructor(protected readonly columns: IColumnExpression[], protected readonly dbContext: DbContext) {
    }
    private convertTo<T>(input: string, type: GenericType<T>, timezoneOffset?: number): T {
        switch (type as any) {
            case Boolean:
                return (input === "1") as any;
            case Number:
                return Number.parseFloat(input) as any;
            case String:
                return input as any;
            case Date:
                return new Date(input) as any;
            default:
                throw new Error(`${type.name} not supported`);
        }
    }
    public parse(rawResult: string[][]): T[] {
        const groupedColumns = this.groupedColumns;
        let entityPathes: any[];
        let result: T[] = [];
        const loadTime = new Date();
        const customTypeMap = new Map<GenericType, Map<string, any>>();
        for (const data of rawResult) {
            let index = 0;
            entityPathes = [];
            for (let i = 0; i < groupedColumns.length; i++) {
                const colGroup = groupedColumns[i];
                let entity = new colGroup.entity.type();
                const entityKey: { [key: string]: any } = {};
                for (const primaryCol of colGroup.primaryColumns) {
                    const prop = primaryCol.alias ? primaryCol.alias : primaryCol.property;
                    entityKey[prop] = this.convertTo(data[index++], primaryCol.type);
                    if (!primaryCol.isShadow)
                        entity[prop] = entityKey[prop];
                }
                let isSkipPopulateEntityData = false;
                const dbSet = this.dbContext.set(colGroup.entity.type);
                if (dbSet) {
                    const existing = dbSet.entry(entity);
                    if (existing) {
                        entity = existing.entity;
                        isSkipPopulateEntityData = existing.loadTime >= loadTime;
                    }
                    else {
                        dbSet.attach(entity, { loadTime: loadTime });
                    }
                }
                else if (Object.keys(entityKey).length > 0) {
                    let existings = customTypeMap.get(colGroup.entity.type);
                    if (!existings) {
                        existings = new Map<any, any>();
                        customTypeMap.set(colGroup.entity.type, existings);
                    }

                    if (Object.keys(entityKey).length > 0) {
                        const entityKeyString = JSON.stringify(entityKey);
                        const existing = existings ? existings.get(entityKeyString) : undefined;
                        if (existing) {
                            entity = existing;
                            isSkipPopulateEntityData = true;
                        }
                        else {
                            existings.set(entityKeyString, entity);
                        }
                    }
                }

                let prevEntity = entityPathes[entityPathes.length - 1];
                if (isSkipPopulateEntityData) {
                    entityPathes.push(entity);
                    index += colGroup.columns.length;
                }
                else if (isValue(entity)) {
                    if (colGroup.columns.length > 0)
                        entity = this.convertTo(data[index++], colGroup.columns[0].type);
                }
                else {
                    entityPathes.push(entity);
                    for (const col of colGroup.columns) {
                        entity[col.alias ? col.alias : col.property] = this.convertTo(data[index++], col.type);
                    }
                }

                if (colGroup.entity.path) {
                    if (entityPathes.length <= 0) {
                        let existings = customTypeMap.get(colGroup.entity.type.name + "[]" as any);
                        if (!existings) {
                            existings = new Map<any, any>();
                            customTypeMap.set(colGroup.entity.type.name + "[]" as any, existings);
                        }

                        const entityKeyString = JSON.stringify(entity);
                        const existing = existings ? existings.get(entityKeyString) : undefined;
                        if (existing) {
                            prevEntity = existing;
                            isSkipPopulateEntityData = true;
                        }
                        else {
                            prevEntity = [];
                            existings.set(entityKeyString, prevEntity);
                        }
                        entityPathes.push(prevEntity);
                        result.add(prevEntity);
                    }

                    const path = colGroup.entity.path;
                    let property = path.replace(/\[\]$/, "");
                    if (path !== property) {
                        if (property === "") {
                            prevEntity.add(entity);
                        }
                        else {
                            if (!prevEntity[property]) {
                                prevEntity[property] = [];
                            }
                            (prevEntity[property] as any[]).add(entity);
                        }
                    }
                    else {
                        prevEntity[property] = entity;
                    }
                    if (!colGroup.isCustomObject) {
                        let relationMeta: IRelationMetaData<any, any> = colGroup.entity.type !== Object ? Reflect.getOwnMetadata(relationMetaKey, prevEntity.constructor, property) : undefined;
                        if (relationMeta && relationMeta.reverseProperty) {
                            const reverseRelationMeta = Reflect.getOwnMetadata(relationMetaKey, entity.constructor, relationMeta.reverseProperty);
                            if (reverseRelationMeta.relationType === RelationType.OneToOne)
                                entity[relationMeta.reverseProperty] = prevEntity;
                            else {
                                if (!entity[relationMeta.reverseProperty]) {
                                    entity[relationMeta.reverseProperty] = [];
                                }
                                entity[relationMeta.reverseProperty].add(prevEntity);
                            }
                        }
                    }
                }
                else {
                    result.add(entity);
                }

                // entityPathes.add(entity);
            }
        }
        return result;
    }
}
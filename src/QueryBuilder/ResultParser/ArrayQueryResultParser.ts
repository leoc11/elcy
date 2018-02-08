import { IQueryResultParser } from "./IQueryResultParser";
import { IColumnExpression } from "../../Linq/Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Linq/Queryable/QueryExpression/IEntityExpression";
import { DbContext } from "../../Linq/DBContext";
import { relationMetaKey } from "../../Decorator/DecoratorKey";
import { IRelationMetaData } from "../../MetaData/Interface/index";
import { GenericType } from "../../Common/Type";

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
                columns: o.where((c) => !c.isPrimary && c.alias !== "").toArray(),
                isCustomObject: o.any((c) => c.alias !== undefined)
            })).toArray();
        }
        return this._groupedColumns;
    }
    private _groupedColumns: IGroupedColumnParser[];
    constructor(protected readonly columns: IColumnExpression[], protected readonly dbContext: DbContext) {
    }
    private convertTo<T>(input: string, type: GenericType<T>): T {
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
        let prevEntity: any;
        let result: T[] = [];
        const loadTime = new Date();
        const customTypeMap = new Map<GenericType, Map<string, any>>();
        for (const data of rawResult) {
            let index = 0;
            prevEntity = null;
            for (let i = 0; i < groupedColumns.length; i++) {
                const colGroup = groupedColumns[i];
                let entity = new colGroup.entity.type();
                const entityKey: { [key: string]: any } = {};
                for (const primaryCol of colGroup.primaryColumns) {
                    const prop = primaryCol.alias ? primaryCol.alias : primaryCol.property;
                    entityKey[prop] = this.convertTo(data[index++], primaryCol.type);
                    if (primaryCol.alias !== "")
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

                if (isSkipPopulateEntityData) {
                    index += colGroup.columns.length;
                }
                else {
                    for (const col of colGroup.columns) {
                        entity[col.alias ? col.alias : col.property] = this.convertTo(data[index++], col.type);
                    }
                }

                if (!prevEntity) {
                    result.add(entity);
                }
                else {
                    if (colGroup.entity.path) {
                        const path = colGroup.entity.path;
                        const property = path.replace(/\[\]$/, "");
                        if (path !== property) {
                            if (!prevEntity[property]) {
                                prevEntity[property] = [];
                            }
                            (prevEntity[property] as any[]).add(entity);
                        }
                        else {
                            prevEntity[property] = entity;
                        }
                        if (!colGroup.isCustomObject) {
                            const relationMeta: IRelationMetaData<any, any> = colGroup.entity.type !== Object ? Reflect.getOwnMetadata(relationMetaKey, colGroup.entity.type, property) : undefined;
                            if (relationMeta && relationMeta.reverseProperty) {
                                entity[relationMeta.reverseProperty] = prevEntity;
                            }
                        }
                    }
                }

                prevEntity = entity;
            }
        }
        return result;
    }
}
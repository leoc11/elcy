import { IQueryResultParser } from "./IQueryResultParser";
import { IColumnExpression } from "../../Linq/Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Linq/Queryable/QueryExpression/IEntityExpression";
import { DbContext } from "../../Linq/DBContext";
import { relationMetaKey } from "../../Decorator/DecoratorKey";
import { IRelationMetaData } from "../../MetaData/Interface/index";
import { GenericType, RelationType, JoinType } from "../../Common/Type";
import { isValue } from "../../Helper/Util";
import { EntityBase } from "../../Data/EntityBase";

export interface IColumnParserData<T = any> {
    column: IColumnExpression<T>;
    index: number;
}
export interface IGroupedColumnParser {
    entity: IEntityExpression;
    primaryColumns: IColumnParserData[];
    columns: IColumnParserData[];
}
export class ArrayQueryResultParser<T extends EntityBase> implements IQueryResultParser<T> {
    protected get groupedColumns(): IGroupedColumnParser[] {
        if (!this._groupedColumns) {
            this._groupedColumns = this.columns.groupBy((o) => o.entity).select((o) => ({
                entity: o.key,
                primaryColumns: o.where((c) => c.isPrimary).select((c) => ({ column: c, index: this.columns.indexOf(c) })).toArray(),
                columns: o.where((c) => !c.isPrimary && !c.isShadow).select((c) => ({ column: c, index: this.columns.indexOf(c) })).toArray()
            })).toArray();
        }
        return this._groupedColumns;
    }
    private _groupedColumns: IGroupedColumnParser[];
    constructor(protected readonly columns: IColumnExpression[], protected readonly dbContext: DbContext, protected readonly entity: IEntityExpression<T>) {
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
        let result: T[] = [];
        const loadTime = new Date();
        const customTypeMap = new Map<IEntityExpression, Map<string, any>>();
        for (const data of rawResult) {
            const entity = this.parseEntity(this.entity, data, loadTime, customTypeMap);
            result.add(entity);
        }
        return result;
    }

    public parseEntity<TE extends EntityBase>(entityExp: IEntityExpression<TE>, rawResult: string[], loadTime: Date, customTypeMap: Map<IEntityExpression, Map<string, any>>) {
        const colGroup = this.groupedColumns.first((o) => o.entity === entityExp);
        let entity: TE = new entityExp.type();
        const entityKey: { [key: string]: any } = {};
        for (const primaryCol of colGroup.primaryColumns) {
            const prop = primaryCol.column.alias ? primaryCol.column.alias : primaryCol.column.property;
            entityKey[prop] = this.convertTo(rawResult[primaryCol.index], primaryCol.column.type);
            if (!primaryCol.column.isShadow)
                (entity as any)[prop] = entityKey[prop];
        }

        let isSkipPopulateEntityData = false;
        const dbSet = this.dbContext.set(entityExp.type);
        if (dbSet) {
            const existing = dbSet.entry(entity as TE);
            if (existing) {
                entity = existing.entity;
                isSkipPopulateEntityData = existing.loadTime >= loadTime;
            }
            else {
                dbSet.attach(entity as any, { loadTime: loadTime });
            }
        }
        else if (Object.keys(entityKey).length > 0) {
            let existings = customTypeMap.get(entityExp);
            if (!existings) {
                existings = new Map<any, any>();
                customTypeMap.set(entityExp, existings);
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

        if (!isSkipPopulateEntityData) {
            if (isValue(entity)) {
                if (colGroup.columns.length > 0)
                    entity = this.convertTo(rawResult[colGroup.columns[0].index], colGroup.columns[0].column.type);
            }
            else {
                for (const col of colGroup.columns) {
                    (entity as any)[col.column.alias ? col.column.alias : col.column.property] = this.convertTo(rawResult[col.index], col.column.type);
                }
            }
        }

        for (const rel of entityExp.relations) {
            const childEntity = this.parseEntity(rel.child, rawResult, loadTime, customTypeMap);
            if (rel.type === JoinType.LEFT) {
                if (rel.name === "[]" && Array.isArray(entity))
                    entity.push(childEntity);
                else {
                    if (!(entity as any)[rel.name])
                        (entity as any)[rel.name] = [];
                    (entity as any)[rel.name].add(childEntity);
                }
            }
            else {
                (entity as any)[rel.name] = childEntity;
            }

            if (entityExp.type as any !== Object) {
                let relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, entityExp.type, rel.name);
                if (relationMeta && relationMeta.reverseProperty) {
                    const reverseRelationMeta = Reflect.getOwnMetadata(relationMetaKey, childEntity.constructor, relationMeta.reverseProperty);
                    if (reverseRelationMeta.relationType === RelationType.OneToOne)
                        childEntity[relationMeta.reverseProperty] = entity;
                    else {
                        if (!childEntity[relationMeta.reverseProperty]) {
                            childEntity[relationMeta.reverseProperty] = [];
                        }
                        childEntity[relationMeta.reverseProperty].add(entity);
                    }
                }
            }
        }
        return entity;
    }
}

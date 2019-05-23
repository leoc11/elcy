import { IObjectType } from "../../Common/Type";
import { EntityEntry } from "../../Data/EntityEntry";
import { EntityState } from "../../Data/EntityState";
import { IEnumerable } from "../../Enumerable/IEnumerable";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
export class InsertExpression<T = any> implements IQueryExpression<void> {
    public option: IQueryOption;
    public paramExps: SqlParameterExpression[] = [];
    private _columns: Array<IColumnExpression<T>>;
    public get columns(): Array<IColumnExpression<T>> {
        if (!this._columns && this.entity instanceof EntityExpression) {
            this._columns = this.entity.metaData.relations
                .where((o) => !o.nullable && !o.isMaster && o.relationType === "one")
                .selectMany((o) => o.relationColumns)
                .union(this.entity.metaData.columns)
                .except(this.entity.metaData.insertGeneratedColumns)
                .select((o) => this.entity.columns.first((c) => c.propertyName === o.propertyName)).toArray();
        }
        return this._columns;
    }

    public get type() {
        return undefined as any;
    }
    constructor(public readonly entity: IEntityExpression<T>, public readonly values: Array<{ [key in keyof T]?: IExpression<T[key]> }>, columns?: Array<IColumnExpression<T>>) {
        if (columns) { this._columns = columns; }
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): InsertExpression<T> {
        if (!replaceMap) { replaceMap = new Map(); }
        const entity = resolveClone(this.entity, replaceMap);
        const columns = this.columns.select((o) => resolveClone(o, replaceMap)).toArray();
        const values = this.values.select((o) => {
            const item: { [key in keyof T]?: IExpression<T[key]> } = {};
            for (const prop in o) {
                item[prop] = resolveClone(o[prop], replaceMap);
            }
            return item;
        }).toArray();
        const clone = new InsertExpression(entity, values, columns);
        replaceMap.set(this, clone);
        return clone;
    }
    public toString(): string {
        return `Insert(${this.entity.toString()})`;
    }
    public hashCode() {
        return hashCode("INSERT", hashCode(this.entity.name, this.values.select((o) => {
            let hash = 0;
            for (const prop in o) {
                hash += hashCode(prop, o[prop].hashCode());
            }
            return hash;
        }).sum()));
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}

export const insertEntryExp = <T>(insertExp: InsertExpression<T>, entry: EntityEntry<T>, columns: IEnumerable<IColumnMetaData<T>>, relations: IEnumerable<IRelationMetaData<T>>, queryParameters: IQueryParameterMap) => {
    const itemExp: { [key in keyof T]?: IExpression<T[key]> } = {};
    for (const col of columns) {
        const value = entry.entity[col.propertyName];
        if (value !== undefined) {
            const param = new SqlParameterExpression(new ParameterExpression("", col.type), col);
            queryParameters.set(param, { value: value });
            itemExp[col.propertyName] = param;
            insertExp.paramExps.push(param);
        }
    }

    for (const rel of relations) {
        const parentEntity = entry.entity[rel.propertyName] as any;
        if (parentEntity) {
            const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
            const isGeneratedPrimary = parentEntry.state === EntityState.Added && parentEntry.metaData.hasIncrementPrimary;
            for (const [col, parentCol] of rel.relationMaps) {
                let paramExp = new SqlParameterExpression(new ParameterExpression("", parentCol.type), parentCol);
                if (isGeneratedPrimary) {
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData).indexOf(parentEntry);
                    paramExp = new SqlParameterExpression(new MemberAccessExpression(new ParameterExpression(index.toString(), parentEntry.metaData.type), parentCol.columnName), parentCol);
                    queryParameters.set(paramExp, { name: parentEntry.metaData.name });
                }
                else {
                    const value = parentEntity[parentCol.propertyName];
                    queryParameters.set(paramExp, { value: value });
                }

                insertExp.paramExps.push(paramExp);
                itemExp[col.propertyName] = paramExp;
            }
        }
    }

    insertExp.values.push(itemExp);
    return itemExp;
};

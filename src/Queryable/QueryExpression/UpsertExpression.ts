import { IObjectType } from "../../Common/Type";
import { EntityEntry } from "../../Data/EntityEntry";
import { EntityState } from "../../Data/EntityState";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
export class UpsertExpression<T = any> implements IQueryExpression<void> {
    public get insertColumns(): Array<IColumnExpression<T>> {
        if (!this._insertColumns) {
            this._insertColumns = this.relations
                .selectMany((o) => o.relationColumns)
                .union(this.entity.metaData.columns)
                .except(this.entity.metaData.insertGeneratedColumns)
                .select((o) => this.entity.columns.first((c) => c.propertyName === o.propertyName)).toArray();
        }

        return this._insertColumns;
    }
    public get relations(): Array<IRelationMetaData<T>> {
        if (!this._relations) {
            this._relations = this.entity.metaData.relations
                .where((o) => !o.nullable && !o.isMaster && o.relationType === "one").toArray();
        }
        return this._relations;
    }
    public get type() {
        return undefined as any;
    }
    public get updateColumns(): Array<IColumnExpression<T>> {
        if (!this._updateColumns) {
            this._updateColumns = this.insertColumns.where((o) => !o.isPrimary).toArray();
        }

        return this._updateColumns;
    }
    public set updateColumns(value) {
        this._updateColumns = value;
    }

    public get where(): IExpression<boolean> {
        return this.entity.primaryColumns.select((o) => {
            const valueExp = this.setter[o.propertyName];
            return new StrictEqualExpression(o, valueExp);
        }).reduce<IExpression<boolean>>((acc, item) => acc ? new AndExpression(acc, item) : item);
    }
    constructor(public readonly entity: EntityExpression<T>, public readonly setter: { [key in keyof T]?: IExpression<T[key]> }) {
    }
    public paramExps: SqlParameterExpression[];
    private _insertColumns: Array<IColumnExpression<T>>;
    private _relations: Array<IRelationMetaData<T>>;
    private _updateColumns: Array<IColumnExpression<T>>;
    public clone(replaceMap?: Map<IExpression, IExpression>): UpsertExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const setter: { [key in keyof T]?: IExpression<T[key]> } = {};
        for (const prop in this.setter) {
            setter[prop] = resolveClone(this.setter[prop], replaceMap);
        }
        const clone = new UpsertExpression(entity, setter);
        replaceMap.set(this, clone);
        return clone;
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
    public hashCode() {
        let code = 0;
        for (const prop in this.setter) {
            code += hashCode(prop, this.setter[prop].hashCode());
        }
        return hashCode("UPSERT", hashCode(this.entity.name, code));
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.setter) {
            const val = this.setter[prop];
            setter += `${prop}:${val.toString()},\n`;
        }
        return `Upsert(${this.entity.toString()}, {${setter}})`;
    }
}

export const upsertEntryExp = <T>(upsertExp: UpsertExpression<T>, entry: EntityEntry<T>, queryParameters: IQueryParameterMap) => {
    for (const col of upsertExp.insertColumns) {
        const value = entry.entity[col.propertyName];
        if (value !== undefined) {
            const paramExp = new SqlParameterExpression(new ParameterExpression("", col.type), col.columnMeta);
            queryParameters.set(paramExp, { value: value });
            upsertExp.setter[col.propertyName] = paramExp;
        }
    }

    for (const rel of upsertExp.relations) {
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

                upsertExp.setter[col.propertyName] = paramExp;
            }
        }
    }

    upsertExp.paramExps = Array.from(queryParameters.keys());
    return upsertExp.setter;
};

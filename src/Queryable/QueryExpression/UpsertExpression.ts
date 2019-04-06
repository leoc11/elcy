import { IQueryExpression } from "./IQueryExpression";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { SqlParameterExpression } from "./SqlParameterExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IObjectType } from "../../Common/Type";
import { hashCode, resolveClone } from "../../Helper/Util";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EntityEntry } from "../../Data/EntityEntry";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { EntityState } from "../../Data/EntityState";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { IQueryOption } from "../../Query/IQueryOption";
export class UpsertExpression<T = any> implements IQueryExpression<void> {
    public option: IQueryOption;
    private _updateColumns: IColumnExpression<T>[];
    public get updateColumns(): IColumnExpression<T>[] {
        if (!this._updateColumns) {
            this._updateColumns = this.insertColumns.where(o => !o.isPrimary).toArray();
        }

        return this._updateColumns;
    }
    public set updateColumns(value) {
        this._updateColumns = value;
    }
    public paramExps: SqlParameterExpression[];
    private _insertColumns: IColumnExpression<T>[];
    public get insertColumns(): IColumnExpression<T>[] {
        if (!this._insertColumns) {
            this._insertColumns = this.relations
            .selectMany(o => o.relationColumns)
            .union(this.entity.metaData.columns)
            .except(this.entity.metaData.insertGeneratedColumns)
            .select(o => this.entity.columns.first(c => c.propertyName === o.propertyName)).toArray();
        }

        return this._insertColumns;
    }
    private _relations: IRelationMetaData<T>[];
    public get relations(): IRelationMetaData<T>[] {
        if (!this._relations) {
            this._relations = this.entity.metaData.relations
                .where(o => !o.nullable && !o.isMaster && o.relationType === "one").toArray();
        }
        return this._relations;
    }

    public get where(): IExpression<boolean> {
        return this.entity.primaryColumns.select(o => {
            const valueExp = this.setter[o.propertyName];
            return new StrictEqualExpression(o, valueExp);
        }).reduce<IExpression<boolean>>((acc, item) => acc ? new AndExpression(acc, item) : item);
    }
    public get type() {
        return undefined as any;
    }
    constructor(public readonly entity: EntityExpression<T>, public readonly setter: { [key in keyof T]?: IExpression<T[key]> }) {
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): UpsertExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const setter: { [key in keyof T]?: IExpression<T[key]> } = {};
        for (const prop in this.setter) {
            setter[prop] = resolveClone(this.setter[prop], replaceMap);
        }
        const clone = new UpsertExpression(entity, setter);
        replaceMap.set(this, clone);
        return clone;
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.setter) {
            const val = this.setter[prop];
            setter += `${prop}:${val.toString()},\n`;
        }
        return `Upsert(${this.entity.toString()}, {${setter}})`;
    }
    public hashCode() {
        let code = 0;
        for (const prop in this.setter) {
            code += hashCode(prop, this.setter[prop].hashCode());
        }
        return hashCode("UPSERT", hashCode(this.entity.name, code));
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}

export const upsertEntryExp = <T>(upsertExp: UpsertExpression<T>, entry: EntityEntry<T>, queryParameters: IQueryParameterMap) => {
    for (const col of upsertExp.insertColumns) {
        let value = entry.entity[col.propertyName];
        if (value !== undefined) {
            let paramExp = new SqlParameterExpression(new ParameterExpression("", col.type), col.columnMeta);
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
                    let value = parentEntity[parentCol.propertyName];
                    queryParameters.set(paramExp, { value: value });
                }

                upsertExp.setter[col.propertyName] = paramExp;
            }
        }
    }

    upsertExp.paramExps = Array.from(queryParameters.keys());
    return upsertExp.setter;
};

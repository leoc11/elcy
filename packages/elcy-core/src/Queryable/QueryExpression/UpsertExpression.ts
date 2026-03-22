import { Enumerable } from "@elcy/enumerable";
import { GenericType, IObjectType, SetterObj, StringKeyOf, ValueType } from "../../Common/Type";
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
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";

export class UpsertExpression<TE extends object = object> implements IQueryExpression<void> {
    public get insertColumns(): Array<IColumnExpression<TE>> {
        if (!this._insertColumns) {
            this._insertColumns = Enumerable.from(this.relations)
                .flatMap((o) => o.relationColumns)
                .union(this.entity.metaData.columns)
                .except(this.entity.metaData.insertGeneratedColumns)
                .map((o) => this.entity.columns.find((c) => c.propertyName === o.propertyName))
                .toArray();
        }

        return this._insertColumns;
    }
    public get relations(): Array<IRelationMetaData<TE, object>> {
        if (!this._relations) {
            this._relations = this.entity.metaData.relations
                .filter((o) => !o.nullable && !o.isMaster && o.relationType === "one");
        }
        return this._relations;
    }
    public get type() {
        return undefined as GenericType<void[]>;
    }
    public get updateColumns(): Array<IColumnExpression<TE>> {
        if (!this._updateColumns) {
            this._updateColumns = this.insertColumns.filter((o) => !o.isPrimary);
        }

        return this._updateColumns;
    }
    public set updateColumns(value) {
        this._updateColumns = value;
    }

    public get where(): IExpression<boolean> {
        return this.entity.primaryColumns.map((o) => {
            const valueExp = this.setter[o.propertyName];
            return new StrictEqualExpression(o, valueExp);
        }).reduce<IExpression<boolean>>((acc, item) => acc ? new AndExpression(acc, item) : item, null);
    }
    constructor(public readonly entity: EntityExpression<TE>, public readonly setter: SetterObj<TE, TE[keyof TE] & ValueType>) {
    }
    public paramExps: SqlParameterExpression[];
    private _insertColumns: Array<IColumnExpression<TE>>;
    private _relations: Array<IRelationMetaData<TE, object>>;
    private _updateColumns: Array<IColumnExpression<TE>>;
    public clone(replaceMap?: Map<IExpression, IExpression>): UpsertExpression<TE> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const setter: SetterObj<TE, TE[keyof TE] & ValueType> = {};
        for (const prop in this.setter) {
            setter[prop as StringKeyOf<TE>] = resolveClone(this.setter[prop as StringKeyOf<TE>], replaceMap);
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
            code += hashCode(prop, this.setter[prop as StringKeyOf<TE>].hashCode());
        }
        return hashCode("UPSERT", hashCode(this.entity.name, code));
    }
    public toString(): string {
        let setter = "";
        for (const prop in this.setter) {
            const val = this.setter[prop as StringKeyOf<TE>];
            setter += `${prop}:${val.toString()},\n`;
        }
        return `Upsert(${this.entity.toString()}, {${setter}})`;
    }
}

export const upsertEntryExp = <T extends object>(upsertExp: UpsertExpression<T>, entry: EntityEntry<T>, queryParameters: IQueryParameterMap) => {
    for (const col of upsertExp.insertColumns) {
        const value = entry.entity[col.propertyName];
        if (value !== undefined) {
            const paramExp = new SqlParameterExpression(new ParameterExpression("", col.type as GenericType<T[keyof T] & ValueType>), col.columnMeta as unknown as IColumnMetaData<object, T[keyof T] & ValueType>);
            queryParameters.set(paramExp, { value: value });
            upsertExp.setter[col.propertyName] = paramExp;
        }
    }

    for (const rel of upsertExp.relations) {
        const parentEntity = entry.entity[rel.propertyName];
        if (parentEntity && typeof parentEntity === "object") {
            const parentEntry = entry.dbSet.dbContext.entry(parentEntity as object);
            const isGeneratedPrimary = parentEntry.state === EntityState.Added && parentEntry.metaData.hasIncrementPrimary;
            for (const [col, parentCol] of rel.relationMaps) {
                let paramExp = new SqlParameterExpression(new ParameterExpression("", parentCol.type as GenericType<T[keyof T] & ValueType>), parentCol as IColumnMetaData<object, T[keyof T] & ValueType>);
                if (isGeneratedPrimary) {
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.metaData).indexOf(parentEntry);
                    paramExp = new SqlParameterExpression(new MemberAccessExpression(new ParameterExpression(index.toString(), parentEntry.metaData.type), parentCol.columnName as never), parentCol as IColumnMetaData<object, T[keyof T] & ValueType>);
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

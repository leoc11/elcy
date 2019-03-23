import { IQueryExpression } from "./IQueryStatementExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IObjectType } from "../../Common/Type";
import { hashCode, resolveClone } from "../../Helper/Util";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EntityEntry } from "../../Data/EntityEntry";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IRelationMetaData } from "../../MetaData/Interface/IRelationMetaData";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { EntityState } from "../../Data/EntityState";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { IQueryOption } from "./IQueryOption";
import { IQueryVisitor } from "../../Query/IQueryVisitor";
export class UpsertExpression<T = any> implements IQueryExpression<void> {
    public option: IQueryOption;
    private _updateColumns: IColumnExpression<T>[];
    public get updateColumns(): IColumnExpression<T>[] {
        if (!this._updateColumns) {
            this._updateColumns = this.columns.where(o => !o.isPrimary).toArray();
        }

        return this._updateColumns;
    }
    public set updateColumns(value) {
        this._updateColumns = value;
    }
    public parameters: SqlParameterExpression[];
    private _columns: IColumnExpression<T>[];
    public get columns(): IColumnExpression<T>[] {
        if (!this._columns) {
            this._columns = this.entity.metaData.relations
                .where(o => !o.nullable && !o.isMaster && o.relationType === "one")
                .selectMany(o => o.relationColumns)
                .union(this.entity.metaData.columns)
                .except(this.entity.metaData.insertGeneratedColumns)
                .select(o => this.entity.columns.first(c => c.propertyName === o.propertyName)).toArray();
        }

        return this._columns;
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

export const upsertEntryExp = <T>(upsertExp: UpsertExpression<T>, entry: EntityEntry<T>, columns: Iterable<IColumnMetaData<T>>, relations: Iterable<IRelationMetaData<T>>, visitor: IQueryVisitor, queryParameters: ISqlParameter[]) => {
    for (const col of columns) {
        let value = entry.entity[col.propertyName];
        if (value !== undefined) {
            let param = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), col.type), col);
            const paramv: ISqlParameter = {
                name: "",
                parameter: param,
                value: value
            };
            queryParameters.push(paramv);
        }
    }

    for (const rel of relations) {
        const parentEntity = entry.entity[rel.propertyName] as any;
        if (parentEntity) {
            const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
            const isGeneratedPrimary = parentEntry.state === EntityState.Added && parentEntry.metaData.hasIncrementPrimary;
            for (const [col, parentCol] of rel.relationMaps) {
                let paramExp = new SqlParameterExpression("", new ParameterExpression(visitor.newAlias("param"), parentCol.type), parentCol);
                if (isGeneratedPrimary) {
                    // TODO: get value from parent.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    paramExp = new SqlParameterExpression(`${parentEntry.metaData.name}`, new MemberAccessExpression(new ParameterExpression(index.toString(), parentEntry.metaData.type), parentCol.columnName), parentCol);
                    upsertExp.parameters.push(paramExp);
                }
                else {
                    let value = parentEntity[parentCol.propertyName];
                    const paramv: ISqlParameter = {
                        name: "",
                        parameter: paramExp,
                        value: value
                    };
                    queryParameters.push(paramv);
                }

                upsertExp.setter[col.propertyName] = paramExp;
            }
        }
    }

    upsertExp.parameters = queryParameters.select(o => o.parameter).toArray();
    return upsertExp.setter;
};

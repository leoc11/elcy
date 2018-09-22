import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQueryCommandExpression } from "./IQueryCommandExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { ValueExpressionTransformer } from "../../ExpressionBuilder/ValueExpressionTransformer";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { EntityExpression } from "./EntityExpression";
import { IColumnExpression } from "./IColumnExpression";
import { IObjectType } from "../../Common/Type";
import { hashCode } from "../../Helper/Util";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
export class UpsertExpression<T = any> implements IQueryCommandExpression<void> {
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
            const index = this.columns.indexOf(o);
            const valueExp = this.values[index];
            return new StrictEqualExpression(o, valueExp);
        }).reduce<IExpression<boolean>>((acc, item) => acc ? new AndExpression(acc, item) : item);
    }
    public get type() {
        return undefined as any;
    }
    constructor(public readonly entity: EntityExpression<T>, public readonly values: Array<IExpression<any> | undefined>) {
    }
    public clone(): UpsertExpression<T> {
        const clone = new UpsertExpression(this.entity.clone(), this.values);
        return clone;
    }
    public toQueryCommands(queryBuilder: QueryBuilder, parameters?: ISqlParameter[]): IQuery[] {
        queryBuilder.setParameters(parameters ? parameters : []);
        return queryBuilder.getUpsertQuery(this);
    }
    public execute() {
        return this as any;
    }
    public toString(queryBuilder: QueryBuilder): string {
        return this.toQueryCommands(queryBuilder).select(o => o.query).toArray().join(";" + queryBuilder.newLine() + queryBuilder.newLine());
    }
    public buildParameter(params: { [key: string]: any }): ISqlParameter[] {
        const result: ISqlParameter[] = [];
        const valueTransformer = new ValueExpressionTransformer(params);
        for (const sqlParameter of this.parameters) {
            const value = sqlParameter.execute(valueTransformer);
            result.push({
                name: sqlParameter.name,
                parameter: sqlParameter,
                value: value
            });
        }
        return result;
    }
    public hashCode() {
        return hashCode("UPSERT", hashCode(this.entity.name, this.values.select(o => hashCode(o.toString())).sum()));
    }
    public getEffectedEntities(): IObjectType[] {
        return this.entity.entityTypes;
    }
}

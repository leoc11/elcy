import { ColumnGeneration, QueryType } from "../../Common/Enum";
import { EntityEntry } from "../../Data/EntityEntry";
import { columnMetaKey } from "../../Decorator/DecoratorKey";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { hasFlags, hashCode, hashCodeAdd } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { IQuery } from "../IQuery";
import { IQueryResult } from "../IQueryResult";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

export class UpdateDeferredQuery<T> extends DMLDeferredQuery<T> {
    constructor(protected readonly entry: EntityEntry<T>, public autoFinalize: boolean = true) {
        super(entry.dbSet.parameter({ entry: entry }));
        if (this.queryOption.beforeSave) {
            this.queryOption.beforeSave(this.entry.entity, { type: "update" });
        }
        if (this.entry.metaData.beforeSave) {
            this.entry.metaData.beforeSave(this.entry.entity, { type: "update" });
        }
        if (this.dbContext.beforeSave) {
            this.dbContext.beforeSave(this.entry.entity, { type: "update" });
        }
    }
    public data: { [K in keyof T]?: any };
    private _finalizeable: boolean;
    public finalize() {
        if (!this._finalizeable) return;
        this._finalizeable = false;

        if (this.data) {
            const queryBuilder = this.dbContext.queryBuilder;
            for (const prop in this.data) {
                const column = this.entry.metaData.columns.first((o) => o.columnName === prop);
                if (column) {
                    this.entry.entity[prop] = queryBuilder.toPropertyValue(this.data[prop], column);
                }
            }
            this.data = null;
        }

        this.entry.acceptChanges();
        if (this.queryOption.afterSave) {
            this.queryOption.afterSave(this.entry.entity, { type: "update" });
        }
        if (this.entry.metaData.afterSave) {
            this.entry.metaData.afterSave(this.entry.entity, { type: "update" });
        }
        if (this.dbContext.afterSave) {
            this.dbContext.afterSave(this.entry.entity, { type: "update" });
        }
    }
    protected buildQueries(visitor: IQueryVisitor): Array<QueryExpression<T[]>> {
        const results: Array<QueryExpression<T[]>> = [];
        const queryExp = this.queryable.buildQuery(visitor) as SelectExpression<T>;
        const paramEntity = new MemberAccessExpression(new ParameterExpression<EntityEntry<T>>("entry", EntityEntry), "entity");
        for (const colExp of queryExp.entity.primaryColumns) {
            const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(paramEntity, colExp.propertyName, colExp.type), colExp.columnMeta);
            queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
        }

        const modifiedColumnMetas = this.entry.getModifiedProperties().select((o) => Reflect.getMetadata(columnMetaKey, this.entry.metaData.type, o) as IColumnMetaData<T>).where((o) => !!o);
        switch (this.entry.metaData.concurrencyMode) {
            case "OPTIMISTIC DIRTY": {
                for (const colMeta of modifiedColumnMetas) {
                    const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MethodCallExpression(new ParameterExpression<EntityEntry<T>>("entry", EntityEntry), "getOriginalValue", [new ValueExpression(colMeta.propertyName)], colMeta.type), colMeta);
                    const colExp = queryExp.entity.columns.first((c) => c.propertyName === colMeta.propertyName);
                    queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
                }
                break;
            }
            case "OPTIMISTIC VERSION": {
                const versionCol: IColumnMetaData<T> = this.entry.metaData.versionColumn || this.entry.metaData.modifiedDateColumn;
                if (!versionCol) {
                    throw new Error(`${this.entry.metaData.name} did not have version column`);
                }
                const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MethodCallExpression(new ParameterExpression<EntityEntry<T>>("entry", EntityEntry), "getOriginalValue", [new ValueExpression(versionCol.propertyName)], versionCol.type), versionCol);
                const colExp = queryExp.entity.columns.first((c) => c.propertyName === versionCol.propertyName);
                queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
                break;
            }
            case "PESSIMISTIC": {
                // TODO
                break;
            }
        }

        const setter: { [K in keyof T]?: IExpression } = {};
        const modifiedProperties = this.entry.getModifiedProperties();

        // modified date and version column should not be modified manually
        if (this.entry.metaData.versionColumn) {
            modifiedProperties.delete(this.entry.metaData.versionColumn.propertyName);
        }

        if (this.entry.metaData.modifiedDateColumn) {
            const prop = this.entry.metaData.modifiedDateColumn.propertyName;
            modifiedProperties.delete(prop);
            setter[prop] = ExpressionBuilder.parse(() => Date.utcTimestamp()).body;
        }

        for (const prop of this.entry.getModifiedProperties()) {
            setter[prop] = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(paramEntity, prop));
        }

        results.push(new UpdateExpression(queryExp, setter));

        // query column that will be auto generated by db if there is any
        queryExp.selects = queryExp.entity.columns.where((o) => hasFlags(o.columnMeta.generation, ColumnGeneration.Update)).toArray();
        if (queryExp.selects.any()) {
            results.push(queryExp);
        }

        return results;
    }
    protected resultParser(results: IQueryResult[], queries?: IQuery[]) {
        let effectedRow = 0;
        for (let i = 0, len = queries.length; i < len; i++) {
            const query = queries[i];
            const result = results[i];
            switch (query.type) {
                case QueryType.DML:
                    effectedRow += result.effectedRows;
                    break;
                case QueryType.DQL: {
                    if (result.rows && result.rows.any()) {
                        this.data = result.rows[0];
                    }
                    break;
                }
            }
        }

        if (effectedRow === 0 && this.entry.metaData.concurrencyMode !== "NONE") {
            throw new Error("DbUpdateConcurrencyException");
        }

        this._finalizeable = true;
        if (this.autoFinalize) {
            this.finalize();
        }
        return effectedRow;
    }
    protected getQueryCacheKey() {
        const propertyHash = this.entry.getModifiedProperties().select((o) => hashCode(o)).sum();
        return hashCodeAdd(hashCode("UPDATE", super.getQueryCacheKey()), hashCode(this.entry.metaData.concurrencyMode, propertyHash));
    }
}

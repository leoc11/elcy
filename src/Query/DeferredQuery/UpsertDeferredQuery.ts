import { ColumnGeneration, QueryType } from "../../Common/Enum";
import { EntityEntry } from "../../Data/EntityEntry";
import { EntityState } from "../../Data/EntityState";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { hasFlags, hashCode, hashCodeAdd, isNull } from "../../Helper/Util";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { IQuery } from "../IQuery";
import { IQueryResult } from "../IQueryResult";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

export class UpsertDeferredQuery<T> extends DMLDeferredQuery<T> {
    protected get insertProperties() {
        if (!this._insertProperties) {
            this._insertProperties = this.entry.metaData.columns
                .where((o) => !hasFlags(o.generation, ColumnGeneration.Insert))
                .where((o) => !(o.defaultExp && isNull(this.entry.entity[o.propertyName])))
                .select((o) => o.propertyName)
                .toArray();
        }
        return this._insertProperties;
    }
    constructor(public readonly entry: EntityEntry<T>, public autoFinalize: boolean = true) {
        super(entry.dbSet.parameter({ entity: entry.entity }));
        this.relationId = {};
        this.queryable.parameter({ relationId: this.relationId });
        this.eventType = this.entry.state === EntityState.Added ? "insert" : "update";
        if (this.queryOption.beforeSave) {
            this.queryOption.beforeSave(this.entry.entity, { type: this.eventType });
        }
        if (this.entry.metaData.beforeSave) {
            this.entry.metaData.beforeSave(this.entry.entity, { type: this.eventType });
        }
        if (this.dbContext.beforeSave) {
            this.dbContext.beforeSave(this.entry.entity, { type: this.eventType });
        }
    }
    public relationId: { [K in keyof T]?: any };
    public data: { [K in keyof T]?: any };
    protected eventType: "insert" | "update";
    private _insertProperties: Array<keyof T>;
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
            this.queryOption.afterSave(this.entry.entity, { type: this.eventType });
        }
        if (this.entry.metaData.afterSave) {
            this.entry.metaData.afterSave(this.entry.entity, { type: this.eventType });
        }
        if (this.dbContext.afterSave) {
            this.dbContext.afterSave(this.entry.entity, { type: this.eventType });
        }
    }
    protected buildQueries(visitor: IQueryVisitor): Array<QueryExpression<T[]>> {
        const results: Array<QueryExpression<T[]>> = [];
        const queryExp = this.queryable.buildQuery(visitor) as SelectExpression<T>;
        for (const colExp of queryExp.entity.primaryColumns) {
            const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<EntityEntry<T>>("entry", EntityEntry), "entity"), colExp.propertyName, colExp.type), colExp.columnMeta);
            queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
        }

        const value: { [K in keyof T]?: IExpression } = {};
        for (const prop of this.insertProperties) {
            const relationIdValue = new MemberAccessExpression(new ParameterExpression("relationId", Object), prop);
            const entityValue = new MemberAccessExpression(new ParameterExpression("entity", this.entry.metaData.type), prop);
            const relationIdExist = new EqualExpression(relationIdValue, new ValueExpression(null));
            value[prop] = queryExp.addSqlParameter(visitor.newAlias("param"), new TernaryExpression(relationIdExist, relationIdValue, entityValue));
        }

        results.push(new UpsertExpression(queryExp.entity as EntityExpression, value, this.entry.getModifiedProperties()));

        // query column that will be auto generated by db if there is any
        queryExp.selects = queryExp.entity.columns.where((o) => hasFlags(o.columnMeta.generation, ColumnGeneration.Insert | ColumnGeneration.Update)).toArray();
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
        this._finalizeable = true;
        if (this.autoFinalize) {
            this.finalize();
        }
        return effectedRow;
    }
    protected getQueryCacheKey() {
        const updateHash = this.entry.getModifiedProperties().select((o) => hashCode(o)).sum();
        const insertHash = this.insertProperties.select((o) => hashCode(o)).sum();
        return hashCodeAdd(hashCode("UPSERT", super.getQueryCacheKey()), hashCodeAdd(insertHash, updateHash));
    }
}

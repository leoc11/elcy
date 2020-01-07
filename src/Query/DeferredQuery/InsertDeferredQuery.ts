import { ColumnGeneration, QueryType } from "../../Common/Enum";
import { EntityEntry } from "../../Data/EntityEntry";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { hasFlags, hashCode, hashCodeAdd, isNull } from "../../Helper/Util";
import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { DbFunction } from "../DbFunction";
import { IQuery } from "../IQuery";
import { IQueryResult } from "../IQueryResult";
import { IQueryVisitor } from "../IQueryVisitor";
import { DMLDeferredQuery } from "./DMLDeferredQuery";

export class InsertDeferredQuery<T> extends DMLDeferredQuery<T> {
    protected get insertProperties() {
        if (!this._insertProperties) {
            this._insertProperties = this.entry.metaData.columns
                .where((o) => !hasFlags(o.generation, ColumnGeneration.Insert))
                .where((o) => !(o.defaultExp && isNull(this.entry.entity[o.propertyName])))
                .toArray();
        }
        return this._insertProperties;
    }
    constructor(public readonly entry: EntityEntry<T>, public autoFinalize: boolean = true) {
        super(entry.dbSet.parameter({ entry: entry }));
        this.relationId = {};
        this.queryable.parameter({ relationId: this.relationId });
        if (this.queryOption.beforeSave) {
            this.queryOption.beforeSave(this.entry.entity, { type: "insert" });
        }
        if (this.entry.metaData.beforeSave) {
            this.entry.metaData.beforeSave(this.entry.entity, { type: "insert" });
        }
        if (this.dbContext.beforeSave) {
            this.dbContext.beforeSave(this.entry.entity, { type: "insert" });
        }
    }
    public relationId: { [K in keyof T]?: any };
    public data: { [K in keyof T]?: any };
    protected finalizeable: boolean;
    private _insertProperties: Array<IColumnMetaData<T>>;
    public finalize() {
        if (!this.finalizeable) return;
        this.finalizeable = false;

        if (this.data) {
            for (const prop in this.data) {
                this.entry.entity[prop] = this.data[prop];
            }
            this.data = null;
        }

        this.entry.acceptChanges();
        if (this.queryOption.afterSave) {
            this.queryOption.afterSave(this.entry.entity, { type: "insert" });
        }
        if (this.entry.metaData.afterSave) {
            this.entry.metaData.afterSave(this.entry.entity, { type: "insert" });
        }
        if (this.dbContext.afterSave) {
            this.dbContext.afterSave(this.entry.entity, { type: "insert" });
        }
    }
    protected buildQueries(visitor: IQueryVisitor): Array<QueryExpression<T>> {
        const results = [];
        const queryExp = this.queryable.buildQuery(visitor) as SelectExpression<T>;
        const value: { [K in keyof T]?: IExpression } = {};
        const entityExp = new MemberAccessExpression(new ParameterExpression<EntityEntry<T>>("entry", EntityEntry), "entity");
        for (const colMeta of this.insertProperties) {
            value[colMeta.propertyName] = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(entityExp, colMeta.propertyName), colMeta);
        }

        const relations = this.entry.metaData.relations
            .where((o) => !o.nullable && !o.isMaster && o.relationType === "one" && !!o.relationMaps)
            .selectMany((o) => o.relationColumns);

        // relation id always used value from master.
        const relationIdExp = new ParameterExpression("relationId", Object);
        for (const sCol of relations) {
            const relationIdValue = new MemberAccessExpression(relationIdExp, sCol.propertyName);
            const entityValue = new MemberAccessExpression(entityExp, sCol.propertyName);
            const relationIdNotExist = new EqualExpression(relationIdValue, new ValueExpression(null));
            const existingParam = value[sCol.propertyName];
            if (existingParam instanceof SqlParameterExpression) {
                queryExp.parameterTree.node.delete(existingParam);
            }
            value[sCol.propertyName] = queryExp.addSqlParameter(visitor.newAlias("param"), new TernaryExpression(relationIdNotExist, entityValue, relationIdValue));
        }

        results.push(new InsertExpression(queryExp.entity, [value]));

        // query column that will be auto generated by db if there is any
        queryExp.selects = queryExp.entity.columns
            .where((o) => hasFlags(o.columnMeta.generation, ColumnGeneration.Insert) || (o.columnMeta.defaultExp && isNull(this.entry.entity[o.propertyName])))
            .toArray();
        if (queryExp.selects.any()) {
            if (this.entry.metaData.hasIncrementPrimary) {
                const incrementColumn = this.entry.metaData.primaryKeys.first((o) => (o as unknown as IntegerColumnMetaData).autoIncrement);
                const lastIdExp = ExpressionBuilder.parse(() => DbFunction.lastInsertedId()).body;
                queryExp.addWhere(new StrictEqualExpression(queryExp.entity.columns.first((c) => c.propertyName === incrementColumn.columnName), lastIdExp));
            }
            else {
                for (const colExp of queryExp.entity.primaryColumns) {
                    const parameter = queryExp.addSqlParameter(visitor.newAlias("param"), new MemberAccessExpression(new MemberAccessExpression(new ParameterExpression<EntityEntry<T>>("entry", EntityEntry), "entity"), colExp.propertyName, colExp.type), colExp.columnMeta);
                    queryExp.addWhere(new StrictEqualExpression(colExp, parameter));
                }
            }
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
                    // Apply new update generated column value
                    if (result.rows && result.rows.any()) {
                        const data = result.rows[0];
                        this.data = {};
                        const queryBuilder = this.dbContext.queryBuilder;
                        for (const prop in data) {
                            const column = this.entry.metaData.columns.first((o) => o.columnName === prop);
                            if (column) {
                                this.data[column.propertyName] = queryBuilder.toPropertyValue(data[prop], column);
                            }
                        }
                    }
                    break;
                }
            }
        }
        this.finalizeable = true;
        if (this.autoFinalize) {
            this.finalize();
        }
        return effectedRow;
    }
    protected getQueryCacheKey() {
        const propertyHash = this.insertProperties.select((o) => hashCode(o.propertyName)).sum();
        return hashCodeAdd(hashCode("INSERT", super.getQueryCacheKey()), propertyHash);
    }
}

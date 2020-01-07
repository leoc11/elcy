import { EntityEntry } from "../../../Data/EntityEntry";
import { EqualExpression } from "../../../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../../../ExpressionBuilder/Expression/IExpression";
import { MemberAccessExpression } from "../../../ExpressionBuilder/Expression/MemberAccessExpression";
import { ParameterExpression } from "../../../ExpressionBuilder/Expression/ParameterExpression";
import { TernaryExpression } from "../../../ExpressionBuilder/Expression/TernaryExpression";
import { ValueExpression } from "../../../ExpressionBuilder/Expression/ValueExpression";
import { InsertDeferredQuery } from "../../../Query/DeferredQuery/InsertDeferredQuery";
import { IQuery } from "../../../Query/IQuery";
import { IQueryResult } from "../../../Query/IQueryResult";
import { IQueryVisitor } from "../../../Query/IQueryVisitor";
import { InsertExpression } from "../../../Queryable/QueryExpression/InsertExpression";
import { QueryExpression } from "../../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../../Queryable/QueryExpression/SqlParameterExpression";

export class MssqlInsertDeferredQuery<T> extends InsertDeferredQuery<T> {
    constructor(entry: EntityEntry<T>, autoFinalize: boolean = true) {
        super(entry, autoFinalize);
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

        const insertExp = new InsertExpression(queryExp.entity, [value]);
        insertExp.parameterTree = queryExp.parameterTree;
        results.push(insertExp);
        return results;
    }
    protected resultParser(results: IQueryResult[], queries?: IQuery[]) {
        let effectedRow = 0;
        for (let i = 0, len = queries.length; i < len; i++) {
            const result = results[i];
            effectedRow += result.effectedRows;
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
        }

        this.finalizeable = true;
        if (this.autoFinalize) {
            this.finalize();
        }
        return effectedRow;
    }
}

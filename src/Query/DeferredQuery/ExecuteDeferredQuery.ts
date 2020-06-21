import { QueryType } from "../../Common/Enum";
import { DbContext } from "../../Data/DbContext";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../../Helper/Util";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { IQuery } from "../IQuery";
import { IQueryOption } from "../IQueryOption";
import { IQueryResult } from "../IQueryResult";
import { DeferredQuery } from "./DeferredQuery";

const resultParser = (result: IQueryResult[]) => {
    return result.sum((o) => o.effectedRows);
};
export class ExecuteDeferredQuery extends DeferredQuery<number> {
    public get queries() {
        if (!this._queries) {
            this._queries = [{
                query: this.sql,
                parameters: this.parameter,
                type: QueryType.DML
            }];

        }
        return this._queries;
    }
    public get sql() {
        if (!this._sql) {
            const template = this.dbContext.queryBuilder.toString(new SqlParameterExpression("$1", new ParameterExpression("$1")));
            this._sql = this.rawSql.replace(/\$\{([a-z_][a-z0-9_]*)\}/ig, template);
        }
        return this._sql;
    }
    constructor(dbContext: DbContext,
                private rawSql: string,
                private parameter?: { [key: string]: any },
                queryOption?: IQueryOption) {
        super(dbContext, queryOption);
    }
    protected resultParser = resultParser;
    private _queries: IQuery[];
    private _sql: string;
    public hashCode(): number {
        return hashCode(this.sql);
    }
}

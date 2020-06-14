import { QueryType } from "../../Common/Enum";
import { DbContext } from "../../Data/DbContext";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { hashCode } from "../../Helper/Util";
import { IQuery } from "../IQuery";
import { IQueryOption } from "../IQueryOption";
import { IQueryResult } from "../IQueryResult";
import { DeferredQuery } from "./DeferredQuery";

const resultParser = (result: IQueryResult[]) => result.sum((o) => o.effectedRows);
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
            this._sql = this.rawSql.replace(/\$\{([a-z][a-z0-9])\}/ig, this.dbContext.queryBuilder.toString(new ParameterExpression("$1")));
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
    private _parameters: Map<string, any>;
    public hashCode(): number {
        return hashCode(this.sql);
    }
}

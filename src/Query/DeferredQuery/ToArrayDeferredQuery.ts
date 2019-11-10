import { QueryType } from "../../Common/Enum";
import { DbContext } from "../../Data/DbContext";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryResultsParser } from "../IQueryResultsParser";
import { IQueryVisitor } from "../IQueryVisitor";
import { DQLDeferredQuery } from "./DQLDeferredQuery";

export class ToArrayDeferredQuery<T> extends DQLDeferredQuery<T[]> {
    constructor(queryable: Queryable<T>) {
        super(queryable);
    }
    protected getResultParser(queryExp: QueryExpression<T>): IQueryResultsParser<T[]> {
        const parser = this.dbContext.getQueryResultParser(queryExp, this.dbContext.queryBuilder);
        return (result: IQueryResult[], queries, dbContext: DbContext) => {
            let i = 0;
            result = result.where(() => queries[i++].type === QueryType.DQL).toArray();
            return parser.parse(result, dbContext);
        };
    }
    protected buildQuery(visitor: IQueryVisitor): QueryExpression {
        return this.queryable.buildQuery(visitor);
    }
}

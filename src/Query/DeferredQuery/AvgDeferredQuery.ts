import { DbContext } from "../../Data/DbContext";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { hashCode } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryResultsParser } from "../IQueryResultsParser";
import { IQueryVisitor } from "../IQueryVisitor";
import { IQueryVisitParameter } from "../IQueryVisitParameter";
import { DQLDeferredQuery } from "./DQLDeferredQuery";

export class AvgDeferredQuery extends DQLDeferredQuery<number> {
    constructor(queryable: Queryable<number>) {
        super(queryable);
    }
    protected getResultParser(queryExp: QueryExpression<number>): IQueryResultsParser<number> {
        const parser = this.dbContext.getQueryResultParser(queryExp, this.dbContext.queryBuilder);
        return (result: IQueryResult[], queries, dbContext: DbContext) => parser.parse(result, dbContext).first();
    }
    protected buildQuery(visitor: IQueryVisitor): QueryExpression<number> {
        const commandQuery = this.queryable.buildQuery(visitor) as unknown as SelectExpression;
        commandQuery.includes = [];
        const methodExpression = new MethodCallExpression(commandQuery, "avg", []);
        const param: IQueryVisitParameter = { selectExpression: commandQuery, scope: "queryable" };
        return visitor.visit(methodExpression, param) as QueryExpression;
    }
    protected getQueryCacheKey() {
        return hashCode("AVG", super.getQueryCacheKey());
    }
}

import { QueryType } from "../../Common/Enum";
import { DbContext } from "../../Data/DbContext";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { hasFlags, hashCode } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { QueryExpression } from "../../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IQueryResult } from "../IQueryResult";
import { IQueryResultsParser } from "../IQueryResultsParser";
import { IQueryVisitor } from "../IQueryVisitor";
import { IQueryVisitParameter } from "../IQueryVisitParameter";
import { DQLDeferredQuery } from "./DQLDeferredQuery";

export class FirstDeferredQuery<T> extends DQLDeferredQuery<T> {
    constructor(queryable: Queryable<T>) {
        super(queryable);
    }
    protected getResultParser(queryExp: QueryExpression<T>): IQueryResultsParser<T> {
        const parser = this.dbContext.getQueryResultParser(queryExp, this.dbContext.queryBuilder);
        return (result: IQueryResult[], queries, dbContext: DbContext) => {
            let i = 0;
            result = result.where(() => hasFlags(queries[i++].type, QueryType.DQL)).toArray();
            return parser.parse(result, dbContext).first();
        };
    }
    protected buildQuery(visitor: IQueryVisitor): QueryExpression {
        const objectOperand = this.queryable.buildQuery(visitor) as unknown as SelectExpression<T>;
        const methodExpression = new MethodCallExpression(objectOperand, "first", []);
        const param: IQueryVisitParameter = { selectExpression: objectOperand, scope: "queryable" };
        visitor.visit(methodExpression, param);
        return param.selectExpression;
    }
    protected getQueryCacheKey() {
        return hashCode("FIRST", super.getQueryCacheKey());
    }
}

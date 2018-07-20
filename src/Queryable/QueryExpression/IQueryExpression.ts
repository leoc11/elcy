import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";

export interface IQueryExpression<T> extends IExpression<T> {
    toString(queryBuilder: QueryBuilder): string;
    execute(queryBuilder: QueryBuilder): T | any;
}

import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { QueryBuilder } from "../../QueryBuilder";

export interface IQueryExpression<T = any> extends IExpression<T> {
    toString(queryBuilder: QueryBuilder): string;
    execute(queryBuilder: QueryBuilder): T[] | IQueryExpression<T> | any; // TODO remove any
}

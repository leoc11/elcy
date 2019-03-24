import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";

export interface IQueryParameter<T = any> {
    paramExp: SqlParameterExpression<T>;
    value?: T;
    name?: string;
}
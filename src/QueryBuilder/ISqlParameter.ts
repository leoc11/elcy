import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";

export interface ISqlParameter<T = any> {
    parameter: SqlParameterExpression<T>;
    value: T;
    name?: string;
}
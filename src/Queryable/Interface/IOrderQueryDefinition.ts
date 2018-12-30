import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { OrderDirection, ValueType } from "../../Common/Type";

export interface IOrderQueryDefinition<T = any> {
    0: FunctionExpression<ValueType> | ((item: T) => ValueType);
    1?: OrderDirection;
}

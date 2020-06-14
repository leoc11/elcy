import { OrderDirection } from "../../Common/StringType";
import { ValueType } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";

export interface IOrderQueryDefinition<T = any> {
    0: FunctionExpression<ValueType> | ((item: T) => ValueType);
    1?: OrderDirection;
}

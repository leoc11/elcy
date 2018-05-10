import { FunctionExpression } from "../../ExpressionBuilder/Expression";
import { OrderDirection, ValueType } from "../../Common/Type";

export interface IQueryableOrderDefinition<T = any> {
    0: FunctionExpression<T, ValueType> | ((o: T) => ValueType);
    1?: OrderDirection;
}

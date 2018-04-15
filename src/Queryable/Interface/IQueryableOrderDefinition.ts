import { FunctionExpression } from "../../ExpressionBuilder/Expression";
import { OrderDirection, ValueType } from "../../Common/Type";

export interface IQueryableOrderDefinition<T = any> {
    selector: FunctionExpression<T, ValueType> | ((o: T) => ValueType);
    direction?: OrderDirection;
}

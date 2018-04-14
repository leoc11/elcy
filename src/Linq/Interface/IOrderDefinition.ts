import { FunctionExpression } from "../../ExpressionBuilder/Expression";
import { OrderDirection, ValueType } from "../../Common/Type";

export interface IOrderDefinition<T = any> {
    selector: ((o: T) => ValueType);
    direction?: OrderDirection;
}

export interface IQueryableOrderDefinition<T = any> {
    selector: FunctionExpression<T, ValueType> | ((o: T) => ValueType);
    direction?: OrderDirection;
}
export interface IQueryableOrderValue<T = any> extends IQueryableOrderDefinition<T> {
    
}
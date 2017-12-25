import { orderDirection } from "../../Common/Type";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { IEntityQueryExpression } from "./IEntityQueryExpression";

export interface IOrderQueryExpression<T> {
    entity: IEntityQueryExpression<T>;
    property: FunctionExpression<T, any> | keyof T;
    direction: orderDirection;
}

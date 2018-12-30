import { OrderDirection } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export interface IOrderExpression {
    column: IExpression;
    direction: OrderDirection;
}

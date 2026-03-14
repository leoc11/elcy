import { OrderDirection } from "../../Common/StringType";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export interface IOrderExpression {
    column: IExpression;
    direction: OrderDirection;
}

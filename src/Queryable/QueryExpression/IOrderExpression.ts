import { OrderDirection } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnExpression } from "./IColumnExpression";

export interface IOrderExpression {
    column: IColumnExpression | IExpression;
    direction: OrderDirection;
}

import { OrderDirection } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/index";
import { IColumnExpression } from "./IColumnExpression";

export interface IOrderExpression {
    column: IColumnExpression | IExpression;
    direction: OrderDirection;
}

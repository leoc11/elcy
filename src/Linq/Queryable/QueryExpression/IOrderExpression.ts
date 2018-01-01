import { orderDirection } from "../../../Common/Type";
import { ColumnExpression } from "./ColumnExpression";

export interface IOrderExpression {
    column: ColumnExpression;
    direction: orderDirection;
}

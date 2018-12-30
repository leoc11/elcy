import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IEntityQueryExpression } from "./IEntityQueryExpression";

export interface IColumnQueryExpression<T> {
    entity: IEntityQueryExpression<T>;
    property: FunctionExpression | string;
    alias?: string;
}

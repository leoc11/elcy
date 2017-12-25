import { FunctionExpression } from "../../ExpressionBuilder/Expression/index";
import { IEntityQueryExpression } from "./IEntityQueryExpression";

export interface IColumnQueryExpression<T> {
    entity: IEntityQueryExpression<T>;
    property: FunctionExpression<T, any> | string;
    alias?: string;
}

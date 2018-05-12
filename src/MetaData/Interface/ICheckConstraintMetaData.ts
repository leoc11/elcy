import { IConstraintMetaData } from "./IConstraintMetaData";
import { FunctionExpression } from "../../ExpressionBuilder/Expression";

export interface ICheckConstraintMetaData<TE = any> extends IConstraintMetaData<TE> {
    definition?: FunctionExpression<TE, boolean> | string;
}

import { GenericType } from "src/Common/Type";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";


export interface ISqlParameterExpression<T = unknown> extends IExpression<T> {
    valueExp: IExpression<T>;
    type: GenericType<T>;
}

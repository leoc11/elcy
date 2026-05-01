import { IExpression } from "./IExpression";

export interface IMultiOperatorExpression<T = unknown> extends IExpression<T> {
    operands: IExpression[];
    clone(replaceMap?: Map<IExpression, IExpression>): IMultiOperatorExpression<T>;
}

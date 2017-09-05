import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export declare class MethodCallExpression implements IExpression {
    protected ObjectOperand: IExpression;
    protected MethodName: string;
    protected Params: IExpression[];
    static Create(objectOperand: IExpression, methodName: string, params: IExpression[]): ValueExpression<any> | MethodCallExpression;
    constructor(ObjectOperand: IExpression, MethodName: string, Params: IExpression[]);
    ToString(): string;
    Execute(): any;
}

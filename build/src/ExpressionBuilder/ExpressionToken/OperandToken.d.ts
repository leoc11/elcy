import { IExpression } from "../Expression/IExpression";
import { IExpressionToken } from "./IExpressionToken";
export declare class OperandToken implements IExpressionToken {
    readonly Value: IExpression | undefined;
    readonly Remaining: string;
    constructor(Value: IExpression | undefined, Remaining: string);
}

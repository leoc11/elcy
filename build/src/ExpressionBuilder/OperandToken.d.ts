import { IExpressionToken } from "./IExpressionToken";
export declare class OperandToken implements IExpressionToken {
    readonly Value: string;
    readonly Remaining: string;
    constructor(Value: string, Remaining: string);
}

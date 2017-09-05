import { IExpressionToken } from "./IExpressionToken";
export declare class OperatorToken implements IExpressionToken {
    readonly Value: string;
    readonly Remaining: string;
    readonly Priority: number;
    constructor(Value: string, Remaining: string, Priority: number);
}

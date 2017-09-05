import { IExpressionToken } from "./IExpressionToken";
export declare class OperandToken implements IExpressionToken {
    readonly Value: string | undefined;
    readonly Remaining: string;
    constructor(Value: string | undefined, Remaining: string);
}

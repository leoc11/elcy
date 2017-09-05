import { IExpressionToken } from "./IExpressionToken";
export declare class BlockToken implements IExpressionToken {
    readonly Value: string;
    readonly Remaining: string;
    readonly CloseString: string;
    constructor(Value: string, Remaining: string, CloseString: string);
}

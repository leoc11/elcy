import { IExpression } from "../Expression/IExpression";
import { IExpressionToken } from "./IExpressionToken";
export declare class BlockToken implements IExpressionToken {
    readonly Value: IExpression;
    readonly Remaining: string;
    readonly CloseString: string;
    constructor(Value: IExpression, Remaining: string, CloseString: string);
}

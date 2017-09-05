import { IExpression } from "../Expression/IExpression";
import { IExpressionToken } from "./IExpressionToken";

export class BlockToken implements IExpressionToken {
    constructor(readonly Value: IExpression, readonly Remaining: string, readonly CloseString: string) {
    }
}

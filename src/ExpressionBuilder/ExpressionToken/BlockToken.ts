import { IExpressionToken } from "./IExpressionToken";

export class BlockToken implements IExpressionToken {
    constructor(readonly Value: string, readonly Remaining: string, readonly CloseString: string) {
    }
}

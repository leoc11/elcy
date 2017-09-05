import { IExpressionToken } from "./IExpressionToken";

export class OperandToken implements IExpressionToken {
    constructor(readonly Value: string | undefined, readonly Remaining: string) {
    }
}
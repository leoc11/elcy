import { IExpression } from "../Expression/IExpression";
import { IExpressionToken } from "./IExpressionToken";

export class OperandToken implements IExpressionToken {
    constructor(readonly Value: IExpression, readonly Remaining: string) {
    }
}

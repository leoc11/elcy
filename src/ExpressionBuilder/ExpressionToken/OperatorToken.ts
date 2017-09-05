import { IExpressionToken } from "./IExpressionToken";
import { ExpressionOperator } from "./OperatorExpression";
export class OperatorToken implements IExpressionToken {
    public get Value(): string | undefined {
        if (this.Operator)
            return this.Operator.Symbol;
        return undefined;
    }
    public get Priority(): number {
        if (this.Operator)
            return this.Operator.Priority;
        return -1;
    }

    constructor(readonly Remaining: string, protected Operator?: ExpressionOperator) {
    }
}

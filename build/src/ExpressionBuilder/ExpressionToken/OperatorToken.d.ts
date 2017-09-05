import { IExpressionToken } from "./IExpressionToken";
import { ExpressionOperator } from "./OperatorExpression";
export declare class OperatorToken implements IExpressionToken {
    readonly Remaining: string;
    protected Operator: ExpressionOperator | undefined;
    readonly Value: string | undefined;
    readonly Priority: number;
    constructor(Remaining: string, Operator?: ExpressionOperator | undefined);
}

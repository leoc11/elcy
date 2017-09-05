import { IExpressionToken } from "./IExpressionToken";
import { OperatorExpression } from "./OperatorExpression";
export declare class OperatorToken implements IExpressionToken {
    readonly Remaining: string;
    protected Operator: OperatorExpression | undefined;
    readonly Value: string | undefined;
    readonly Priority: number;
    constructor(Remaining: string, Operator?: OperatorExpression | undefined);
}

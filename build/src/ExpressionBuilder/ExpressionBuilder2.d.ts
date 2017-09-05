import { BlockToken, OperandToken, OperatorToken } from "./ExpressionToken/";
/**
 * for parsing function into expression convertable to sql query
 */
export declare class ExpressionBuilder2 {
    Parse(expression: string): string;
    protected GetBlock(expressionStr: string, expressionResult?: string, prevOperators?: OperatorToken[]): BlockToken;
    protected GetOperand(expressionStr: string, prevOperator?: OperatorToken): OperandToken;
    protected GetOperator(expression: string): OperatorToken;
    protected RemoveComments(expression: string): string;
}

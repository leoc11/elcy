import { BlockToken, OperandToken, OperatorToken } from "./ExpressionToken/";
export declare class ExpressionParser {
}
export declare class ExpressionFactory {
}
/**
 * for parsing function into expression convertable to sql query
 */
export declare class ExpressionBuilder {
    Parse(expression: string): string;
    ParseToExpression<T>(parser: ExpressionParser, fn: (...params: any[]) => any, params: any[]): (o: T) => any;
    /**
     * GetFunctionParams
     */
    GetFunctionParams(fn: (...params: any[]) => any): string;
    GetFunctionBody(fn: (...params: any[]) => any): string;
    protected GetBlock(expressionStr: string, expressionResult?: string, prevOperators?: OperatorToken[]): BlockToken;
    protected GetOperand(expressionStr: string, prevOperator?: OperatorToken): OperandToken;
    protected GetOperator(expression: string): OperatorToken;
    protected RemoveComments(expression: string): string;
}

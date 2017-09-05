import { IExpression, SubtractionExpression, ValueExpression } from "./Expression/";
import { BlockToken, OperandToken, OperatorToken } from "./ExpressionToken/";
export declare class ExpressionParser {
}
export declare class ExpressionFactory {
}
/**
 * for parsing function into expression convertable to sql query
 */
export declare class ExpressionBuilder {
    Parse(expression: string): IExpression<any> | null;
    Parse2(expression: string): IExpression<any> | null;
    /**
     * GetFunctionParams
     */
    GetFunctionParams(fn: (...params: any[]) => any): string[];
    GetFunctionBody(fn: (...params: any[]) => any): string;
    protected GetOperatorExpression(operator?: string, ...params: IExpression[]): SubtractionExpression | ValueExpression<any>;
    protected GetBlock(expressionStr: string, expressionResult?: IExpression, prevOperators?: OperatorToken[]): BlockToken | null;
    protected GetOperand(expressionStr: string, prevOperator?: OperatorToken): OperandToken | null;
    protected GetOperator(expression: string): OperatorToken;
    protected RemoveComments(expression: string): string;
}

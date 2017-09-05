export declare class ExpressionBuilder {
    /**
     *
     */
    Parse(expression: string, startOperand?: string): string;
    protected GetOperand(expression: string, excludeGlobalFunction?: boolean): string[];
    protected GetOperator(expression: string, ops?: string[]): string[];
    protected ParseBlock(expression: string, startOperand?: string, endCharacter?: string): string[];
    protected RemoveComments(expression: string): string;
}

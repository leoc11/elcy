export interface IExpressionToken {
    Value: string;
    Remaining: string;
}
export declare class OperandToken implements IExpressionToken {
    Value: string;
    Remaining: string;
    constructor(value: string, remaining: string);
}

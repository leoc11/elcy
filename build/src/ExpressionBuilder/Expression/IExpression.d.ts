export interface IExpression<T = any> {
    Type: undefined | null | Function;
    ToString(): string;
    Execute(): T | any;
}
export declare abstract class ExpressionBase<T> implements IExpression<T> {
    Type: undefined | null | Function;
    constructor(returnType: T);
    ToString(): string;
    Execute(): void;
}

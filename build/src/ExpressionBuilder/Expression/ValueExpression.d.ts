import { ExpressionBase } from "./IExpression";
export declare class ValueExpression<T> implements ExpressionBase<T> {
    protected Value: T;
    private ExpressionString;
    readonly Type: Function | undefined | null;
    constructor(Value: T, ExpressionString?: string);
    ToString(): string;
    Execute(): T;
}

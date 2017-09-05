import { IExpression } from "./IExpression";
export declare class ValueExpression<T> implements IExpression {
    protected Value: T;
    readonly Type: string;
    constructor(Value: T);
    ToString(): string;
    Execute(): void;
}

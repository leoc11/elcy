import { IExpression } from "./IExpression";
export declare class ParameterExpression<T> implements IExpression {
    protected Name: string;
    readonly Type: string;
    constructor(TCtor: {
        new (): T;
    }, Name: string);
    ToString(): string;
    Execute(): void;
}

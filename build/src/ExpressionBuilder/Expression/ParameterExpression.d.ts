import { IExpression } from "./IExpression";
export declare class ParameterExpression<T> implements IExpression {
    protected ParamName: string;
    readonly Type: string;
    constructor(ParamName: string, ctor: {
        new (): T;
    });
    ToString(): string;
    Execute(): void;
}

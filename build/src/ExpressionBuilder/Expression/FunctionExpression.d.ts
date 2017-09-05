import { IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
export declare class FunctionExpression implements IExpression {
    Params: Array<ParameterExpression<any>>;
    Body: IExpression;
    readonly Type: string;
    constructor(Params: Array<ParameterExpression<any>>, Body: IExpression);
    ToString(): string;
    Execute(): void;
}

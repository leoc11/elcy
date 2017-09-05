import { IExpression } from "../Expression/IExpression";
export interface IExpressionToken {
    Value: IExpression | string | undefined;
    Remaining: string;
}

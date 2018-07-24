import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export interface IPagingExpression {
    skip?: IExpression<number>;
    take?: IExpression<number>;
}

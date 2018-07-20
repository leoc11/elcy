import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export interface ISqlParameterBuilderItem {
    name: string;
    valueGetter: IExpression<any>;
}
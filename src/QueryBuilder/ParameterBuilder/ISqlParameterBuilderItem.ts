import { IExpression } from "../../ExpressionBuilder/Expression";

export interface ISqlParameterBuilderItem {
    name: string;
    valueGetter: IExpression<any> | Function;
}
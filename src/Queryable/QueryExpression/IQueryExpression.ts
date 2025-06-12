import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";

export interface IQueryExpression<T = unknown> extends IExpression<T[] | void> {
    paramExps: SqlParameterExpression[];
    clone(replaceMap?: Map<IExpression, IExpression>): IQueryExpression<T>;
    getEffectedEntities(): IObjectType[];
}

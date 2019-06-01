import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";

export interface IQueryExpression<T = any> extends IExpression<T[]> {
    paramExps: SqlParameterExpression[];
    clone(replaceMap?: Map<IExpression, IExpression>): IQueryExpression<T>;
    getEffectedEntities(): IObjectType[];
}

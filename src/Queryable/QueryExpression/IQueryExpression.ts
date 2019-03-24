import { SqlParameterExpression } from "./SqlParameterExpression";
import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IQueryOption } from "../../Query/IQueryOption";

export interface IQueryExpression<T = any> extends IExpression<T[]> {
    clone(replaceMap?: Map<IExpression, IExpression>): IQueryExpression<T>;
    paramExps: SqlParameterExpression[];
    option?: IQueryOption;
    getEffectedEntities(): IObjectType[];
}

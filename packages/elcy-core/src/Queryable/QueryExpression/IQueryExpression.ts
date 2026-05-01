import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IQueryIncludeRelation } from "./IQueryIncludeRelation";
import { SqlParameterExpression } from "./SqlParameterExpression";
export interface IQueryExpression<T = unknown> extends IExpression<T[] | void> {
    paramExps: SqlParameterExpression[];
    includes?: Array<IQueryIncludeRelation<T>>;
    parentRelation?: IQueryIncludeRelation<any, T>;
    clone(replaceMap?: Map<IExpression, IExpression>): IQueryExpression<T>;
    getEffectedEntities(): IObjectType[];
}

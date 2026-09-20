import { ElementType, IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IQueryIncludeRelation } from "./IQueryIncludeRelation";
import { SqlParameterExpression } from "./SqlParameterExpression";
export interface IQueryExpression<T = unknown> extends IExpression<T extends ElementType<infer U> ? U : T[]> {
    paramExps: SqlParameterExpression[];
    includes?: Array<IQueryIncludeRelation<T>>;
    parentRelation?: IQueryIncludeRelation<any, T>;
    clone(replaceMap?: Map<IExpression, IExpression>): this;
    getEffectedEntities(): IObjectType[];
}

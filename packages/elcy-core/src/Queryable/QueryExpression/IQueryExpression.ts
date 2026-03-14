import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";
export interface IQueryIncludeRelation<
    T = unknown,
    TChild = unknown,
    TChildExp extends IQueryExpression<TChild> = IQueryExpression<TChild>,
    TParentExp extends IQueryExpression<T> = IQueryExpression<T>
> {
    child: TChildExp;
    parent: TParentExp;
    relation: IExpression<boolean>;
}
export interface IQueryExpression<T = unknown> extends IExpression<T[] | void> {
    paramExps: SqlParameterExpression[];
    includes?: Array<IQueryIncludeRelation<T>>;
    clone(replaceMap?: Map<IExpression, IExpression>): IQueryExpression<T>;
    getEffectedEntities(): IObjectType[];
}

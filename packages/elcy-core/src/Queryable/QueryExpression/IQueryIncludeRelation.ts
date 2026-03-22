import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { IQueryExpression } from "./IQueryExpression";

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

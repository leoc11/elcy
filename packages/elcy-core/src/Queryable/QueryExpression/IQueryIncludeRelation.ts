import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface IQueryIncludeRelation<
    TE = unknown,
    TChild = unknown,
    TChildExp extends IQueryExpression<TChild> = IQueryExpression<TChild>,
    TParentExp extends IQueryExpression<TE> = IQueryExpression<TE>
> {
    child: TChildExp;
    parent: TParentExp;
    relation: IExpression<boolean>;
}

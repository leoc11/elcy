import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";

export interface IQueryTranslatorItem<T extends IExpression = IExpression> {
    translate: (qb: IQueryBuilder, exp: T, param?: IQueryBuilderParameter) => string;
    isTranslate: (exp: T) => boolean;
}

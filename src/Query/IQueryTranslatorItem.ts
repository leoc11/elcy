import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryBuilderParameter } from "./IQueryBuilderParameter";

export interface IQueryTranslatorItem<T extends IExpression = IExpression> {
    translate: (qb: IQueryBuilder, exp: T, param?: IQueryBuilderParameter) => string;
    isTranslate: (exp: T) => boolean;
}

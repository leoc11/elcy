import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryBuilderContext } from "./IQueryBuilderContext";

export interface IQueryTranslatorItem<T extends IExpression = IExpression> {
    isTranslate: (exp: T) => boolean;
    translate: (qb: IQueryBuilder, exp: T, param?: IQueryBuilderContext) => string;
}

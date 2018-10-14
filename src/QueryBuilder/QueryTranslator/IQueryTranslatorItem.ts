import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { QueryBuilder } from "../QueryBuilder";

export interface IQueryTranslatorItem<T extends IExpression = IExpression> {
    translate: (exp: T, qb: QueryBuilder) => string;
    isPreferTranslate: (exp: T, isValidInApp: boolean) => boolean;
}

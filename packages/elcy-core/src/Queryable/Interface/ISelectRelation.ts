import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { IQueryIncludeRelation } from "../QueryExpression/IQueryIncludeRelation";
import { SelectExpression } from "../QueryExpression/SelectExpression";

export interface ISelectRelation<TE extends object = any, TChild extends object = any> extends IQueryIncludeRelation<TE, TChild, SelectExpression<TChild>, SelectExpression<TE>> {
    childColumns: IColumnExpression[];
    isEmbedded?: boolean;
    parentColumns: IColumnExpression[];
    type: any;
}

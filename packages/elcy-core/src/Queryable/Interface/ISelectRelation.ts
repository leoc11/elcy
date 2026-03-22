import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { IQueryIncludeRelation } from "../QueryExpression/IQueryIncludeRelation";
import { SelectExpression } from "../QueryExpression/SelectExpression";

export interface ISelectRelation<TE extends object = object, TChild extends object = object> extends IQueryIncludeRelation<TE, TChild, SelectExpression<TChild>, SelectExpression<TE>> {
    childColumns: IColumnExpression[];
    isEmbedded?: boolean;
    parentColumns: IColumnExpression[];
    type: any;
}

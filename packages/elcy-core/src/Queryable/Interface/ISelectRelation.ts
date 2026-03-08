import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { IQueryIncludeRelation } from "../QueryExpression/IQueryExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";

export interface ISelectRelation<T extends object = object, TChild extends object = object> extends IQueryIncludeRelation<T, TChild, SelectExpression<TChild>, SelectExpression<T>> {
    childColumns: IColumnExpression<TChild>[];
    isEmbedded?: boolean;
    parentColumns: IColumnExpression<T>[];
    type: any;
}

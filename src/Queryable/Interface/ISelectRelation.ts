import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";

export interface ISelectRelation<T = any, TChild = any> {
    child: SelectExpression<TChild>;
    parent: SelectExpression<T>;
    relation: IExpression<boolean>;
    childColumns: IColumnExpression[];
    parentColumns: IColumnExpression[];
    type: any;
    isEmbedded?: boolean;
}

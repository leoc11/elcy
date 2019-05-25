import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";

export interface ISelectRelation<T = any, TChild = any> {
    child: SelectExpression<TChild>;
    childColumns: IColumnExpression[];
    isEmbedded?: boolean;
    parent: SelectExpression<T>;
    parentColumns: IColumnExpression[];
    relation: IExpression<boolean>;
    type: any;
}

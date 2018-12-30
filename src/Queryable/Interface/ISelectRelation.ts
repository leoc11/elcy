import { SelectExpression } from "../QueryExpression/SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";

export interface ISelectRelation<T = any, TChild = any> {
    child: SelectExpression<TChild>;
    parent: SelectExpression<T>;
    relations: IExpression<boolean>;
    childColumns: IColumnExpression[];
    parentColumns: IColumnExpression[];
    type: any;
    isEmbedded?: boolean;
}

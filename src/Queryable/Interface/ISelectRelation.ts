import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnExpression } from "../QueryExpression/IColumnExpression";
import { SelectExpression } from "../QueryExpression/SelectExpression";

export interface ISelectRelation<T extends object = object, TChild extends object = object> {
    child: SelectExpression<TChild, any>;
    childColumns: IColumnExpression<TChild>[];
    isEmbedded?: boolean;
    parent: SelectExpression<T, any>;
    parentColumns: IColumnExpression<T>[];
    relation: IExpression<boolean>;
    type: any;
}

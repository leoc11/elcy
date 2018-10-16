import { IConstraintMetaData } from "./IConstraintMetaData";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export interface ICheckConstraintMetaData<TE = any> extends IConstraintMetaData<TE> {
    definition?: IExpression<boolean> | string;
    getDefinitionString(queryBuilder: QueryBuilder): string;
}

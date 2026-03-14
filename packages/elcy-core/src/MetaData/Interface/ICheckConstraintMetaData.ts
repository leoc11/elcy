import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IConstraintMetaData } from "./IConstraintMetaData";

export interface ICheckConstraintMetaData<TE extends object = object> extends IConstraintMetaData<TE> {
    definition?: IExpression<boolean> | string;
    getDefinitionString(queryBuilder: IQueryBuilder): string;
}

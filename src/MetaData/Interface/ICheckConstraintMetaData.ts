import { IConstraintMetaData } from "./IConstraintMetaData";
import { RelationQueryBuilder } from "../../Provider/Relation/RelationQueryBuilder";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export interface ICheckConstraintMetaData<TE = any> extends IConstraintMetaData<TE> {
    definition?: IExpression<boolean> | string;
    getDefinitionString(queryBuilder: RelationQueryBuilder): string;
}

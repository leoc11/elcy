import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { RelationQueryBuilder } from "../../Provider/Relation/RelationQueryBuilder";
import { IConstraintMetaData } from "./IConstraintMetaData";

export interface ICheckConstraintMetaData<TE = any> extends IConstraintMetaData<TE> {
    definition?: IExpression<boolean> | string;
    getDefinitionString(queryBuilder: RelationQueryBuilder): string;
}

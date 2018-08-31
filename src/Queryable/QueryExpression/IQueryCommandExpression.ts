import { IQueryExpression } from "./IQueryExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";
import { IObjectType } from "../../Common/Type";

export interface IQueryCommandExpression<T = any> extends IQueryExpression<T[]> {
    clone(): IQueryCommandExpression<T>;
    toQueryCommands(queryBuilder: QueryBuilder, params: ISqlParameter[]): IQuery[];
    parameters: SqlParameterExpression[];
    buildParameter(params: { [key: string]: any }): ISqlParameter[];
    hashCode(): number;
    getEffectedEntities(): IObjectType[];
}

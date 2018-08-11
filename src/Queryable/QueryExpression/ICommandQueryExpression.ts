import { IQueryExpression } from "./IQueryExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { ISqlParameter } from "../../QueryBuilder/ISqlParameter";

export interface ICommandQueryExpression<T = any> extends IQueryExpression<T[]> {
    // entity: IEntityExpression;
    // where: IExpression<boolean>;
    clone(): ICommandQueryExpression<T>;
    toQueryCommands(queryBuilder: QueryBuilder, params: ISqlParameter[]): IQueryCommand[];
    parameters: SqlParameterExpression[];
    buildParameter(params: { [key: string]: any }): ISqlParameter[];
}

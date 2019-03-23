import { ISqlParameter } from "../QueryBuilder/ISqlParameter";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryStatementExpression";
import { IQueryOption } from "../Queryable/QueryExpression/IQueryOption";
export interface IQueryBuilderParameter {
    parameters?: ISqlParameter[];
    option?: IQueryOption;
    queryExpression?: IQueryExpression;
    state?: string;
}

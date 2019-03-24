import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";

export interface IQueryParameter<T = any> {
    paramExp: SqlParameterExpression<T>;
    value?: T;
    name?: string;
}
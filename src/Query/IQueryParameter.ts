import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";

export interface IQueryParameter<T = any> {
    value?: T;
    name?: string;
}

export type IQueryParameterMap = Map<SqlParameterExpression, IQueryParameter>;
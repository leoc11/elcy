import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";

export interface IQueryParameter<T = unknown> {
    name?: string;
    value?: T;
}

export type IQueryParameterMap = Map<SqlParameterExpression, IQueryParameter>;

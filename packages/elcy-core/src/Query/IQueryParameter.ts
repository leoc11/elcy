import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";

export interface IDeferredParameterResolver {
    entityMeta: IEntityMetaData;
    entryIndex: number;
    resolve(value: unknown): void;
}

export interface IQueryParameterValue<T = unknown> {
    name?: string;
    value?: T;
    resolvers?: IDeferredParameterResolver[];
}

export type ISqlParameterValueMap = Map<SqlParameterExpression, IQueryParameterValue>;

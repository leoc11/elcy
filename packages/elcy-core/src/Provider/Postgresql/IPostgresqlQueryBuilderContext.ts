import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";

export interface IPostgresqlQueryBuilderContext extends IQueryBuilderContext {
    placeholders?: SqlParameterExpression[];
}
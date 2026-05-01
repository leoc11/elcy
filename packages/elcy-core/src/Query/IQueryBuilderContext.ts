import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryOption } from "./IQueryOption";
import { ISqlParameterValueMap } from "./IQueryParameter";
export interface IQueryBuilderContext {
    option?: IQueryOption;
    parameters: ISqlParameterValueMap;
    rootQueryExpression?: IQueryExpression;
    queryExpression: IQueryExpression;
    state?: string;
}

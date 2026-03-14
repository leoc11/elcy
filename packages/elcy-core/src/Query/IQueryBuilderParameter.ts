import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryOption } from "./IQueryOption";
import { IQueryParameterMap } from "./IQueryParameter";
export interface IQueryBuilderParameter {
    option?: IQueryOption;
    parameters?: IQueryParameterMap;
    queryExpression?: IQueryExpression;
    state?: string;
}

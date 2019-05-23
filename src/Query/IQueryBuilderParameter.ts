import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryOption } from "./IQueryOption";
import { IQueryParameterMap } from "./IQueryParameter";
export interface IQueryBuilderParameter {
    queryExpression?: IQueryExpression;
    parameters?: IQueryParameterMap;
    option?: IQueryOption;
    state?: string;
}

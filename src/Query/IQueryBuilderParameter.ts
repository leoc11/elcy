import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryOption } from "./IQueryOption";
import { IQueryParameterMap } from "./IQueryParameter";
export interface IQueryBuilderParameter {
    parameters?: IQueryParameterMap;
    option?: IQueryOption;
    queryExpression?: IQueryExpression;
    state?: string;
}

import { QueryExpression } from "../Queryable/QueryExpression/QueryExpression";
import { IQueryOption } from "./IQueryOption";

export interface IQueryBuilderParameter {
    option?: IQueryOption;
    queryExpression?: QueryExpression;
    state?: string;
}

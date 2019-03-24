import { IQueryParameter } from "./IQueryParameter";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQueryOption } from "./IQueryOption";
export interface IQueryBuilderParameter {
    parameters?: IQueryParameter[];
    option?: IQueryOption;
    queryExpression?: IQueryExpression;
    state?: string;
}

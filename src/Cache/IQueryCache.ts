import { IObjectType } from "../Common/Type";
import { IQueryResultsParser } from "../Query/IQueryResultsParser";
import { IQueryTemplate } from "../Query/IQueryTemplate";

export interface IQueryCache<T = any> {
    queryTemplates?: IQueryTemplate[];
    resultParser?: IQueryResultsParser<T>;
    entities?: IObjectType[];
}

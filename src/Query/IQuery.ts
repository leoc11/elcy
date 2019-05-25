import { QueryType } from "../Common/Type";

export interface IQuery {
    comment?: string;
    parameters?: Map<string, any>;
    query: string;
    type: QueryType;
}

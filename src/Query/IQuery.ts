import { QueryType } from "../Common/Type";

export interface IQuery {
    query: string;
    type: QueryType;
    parameters?: Map<string, any>;
    comment?: string;
}

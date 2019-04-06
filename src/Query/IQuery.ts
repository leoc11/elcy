import { QueryType } from "../Common/Type";

export interface IQuery {
    comment?: string;
    query: string;
    parameters?: Map<string, any>;
    type: QueryType;
}

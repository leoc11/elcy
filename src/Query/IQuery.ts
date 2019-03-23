import { QueryType } from "../Common/Type";

export interface IQuery {
    comment?: string;
    query: string;
    parameters?: { [key: string]: any };
    type: QueryType;
}

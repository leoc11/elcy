import { QueryType } from "../Common/Enum";

export interface IQuery {
    comment?: string;
    parameters?: { [key: string]: any };
    query: string;
    type: QueryType;
}

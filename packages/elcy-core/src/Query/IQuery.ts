import { QueryType } from "../Common/Enum";

export interface IQuery {
    comment?: string;
    parameters?: Map<string, any>;
    query: string;
    type: QueryType;
}

import { QueryType } from "../Common/Enum";

export interface IQuery {
    comment?: string;
    parameters?: Map<string, unknown>;
    query: string;
    type: QueryType;
}

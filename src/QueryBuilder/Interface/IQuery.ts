import { QueryType } from "../../Common/Type";

export interface IQuery {
    query: string;
    parameters?: { [key: string]: any };
    type: QueryType;
}

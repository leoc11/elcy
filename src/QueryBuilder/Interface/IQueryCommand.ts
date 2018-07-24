import { QueryType } from "../../Common/Type";

export interface IQueryCommand {
    query: string;
    parameters?: { [key: string]: any };
    type: QueryType;
}

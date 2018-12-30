import { IQuery } from "./IQuery";

export interface IBatchedQuery extends IQuery {
    queryCount: number;
}

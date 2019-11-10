import { DbContext } from "../Data/DbContext";
import { IQuery } from "./IQuery";
import { IQueryResult } from "./IQueryResult";

export type IQueryResultsParser<T = any> = (result: IQueryResult[], queries?: IQuery[], dbContext?: DbContext) => T;

import { IQueryResultParser } from "./ResultParser/IQueryResultParser";
import { QueryCache } from "./QueryCache";
import { IObjectType } from "../Common/Type";
import { DbContext } from "../Data/DBContext";
import { ParameterBuilder } from "./ParameterBuilder/ParameterBuilder";

export interface IQueryCacheManager {
    get<T>(type: IObjectType<DbContext>, key: number): Promise<QueryCache<T> | undefined>;
    set<T>(type: IObjectType<DbContext>, key: number, query: string, queryas: IQueryResultParser<T>, parameterBuilder: ParameterBuilder): Promise<void>;
}
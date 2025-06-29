import "reflect-metadata";
import { DbType } from "../Common/StringType";
import { DbContext } from "./DbContext";
import { IObjectType } from "../Common/Type";
import { IConnectionManager } from "../Connection/IConnectionManager";
import { IQueryCacheManager } from "../Cache/IQueryCacheManager";
import { IResultCacheManager } from "../Cache/IResultCacheManager";

const connectionManagerKey = Symbol("connectionManagerKey");
const queryCacheManagerKey = Symbol("queryCacheManagerKey");
const resultCacheManagerKey = Symbol("resultCacheManagerKey");

export function getConnectionManager<T extends DbType = DbType>(constructor: IObjectType<DbContext<T>>): IConnectionManager<T> {
    return Reflect.getOwnMetadata(connectionManagerKey, constructor);
}
export function setConnectionManager<T extends DbType = DbType>(constructor: IObjectType<DbContext<T>>, conMan: IConnectionManager<T>): void {
    return Reflect.defineMetadata(connectionManagerKey, conMan, constructor);
}
export function getQueryCacheManager(constructor: Function): IQueryCacheManager {
    return Reflect.getOwnMetadata(queryCacheManagerKey, constructor);
}
export function setQueryCacheManager(constructor: Function, cacheMan: IQueryCacheManager): void {
    return Reflect.defineMetadata(queryCacheManagerKey, cacheMan, constructor);
}
export function getResultCacheManager(constructor: Function): IResultCacheManager {
    return Reflect.getOwnMetadata(resultCacheManagerKey, constructor);
}
export function setResultCacheManager(constructor: Function, cacheMan: IResultCacheManager): void {
    return Reflect.defineMetadata(resultCacheManagerKey, cacheMan, constructor);
}

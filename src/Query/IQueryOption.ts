import { ICacheOption } from "../Cache/ICacheOption";
import { ConcurrencyModel } from "../Common/StringType";
import { Version } from "../Common/Version";
import { IDBEventListener } from "../Data/Event/IDBEventListener";

export interface ISelectCacheOption extends ICacheOption {
    disableEntityAsTag?: boolean;
}
export interface IQueryOption {
    concurrencyMode?: ConcurrencyModel;
    // delete
    forceHardDelete?: boolean;
    includeSoftDeleted?: boolean;
    noQueryCache?: boolean;
    // select
    resultCache?: "none" | ISelectCacheOption;
    supportTVP?: boolean;
    // insert/update
    useUpsert?: boolean;
    version?: Version;

    // TODO:
    // comment?: string;
    // noTracking?: boolean;
    // batchSize?: number;
    // batchDelay?: number;
}
export type ISaveOption<T> = IQueryOption & IDBEventListener<T>;

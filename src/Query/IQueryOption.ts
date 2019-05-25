import { ICacheOption } from "../Cache/ICacheOption";
import { ConcurrencyModel } from "../Common/Type";
import { Version } from "../Common/Version";

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

    // noTracking?: boolean;
    // batchSize?: number;
    // batchDelay?: number;
}

import { ICacheOption } from "../Cache/ICacheOption";
import { ConcurrencyModel } from "../Common/Type";
import { Version } from "../Common/Version";

export interface ISelectCacheOption extends ICacheOption {
    disableEntityAsTag?: boolean;
}
export interface IQueryOption {
    noQueryCache?: boolean;
    includeSoftDeleted?: boolean;
    supportTVP?: boolean;
    version?: Version;
    concurrencyMode?: ConcurrencyModel;
    // select
    resultCache?: "none" | ISelectCacheOption;
    // insert/update
    useUpsert?: boolean;
    // delete
    forceHardDelete?: boolean;

    // noTracking?: boolean;
    // batchSize?: number;
    // batchDelay?: number;
}

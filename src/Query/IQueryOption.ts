import { Version } from "../Common/Version";
import { ICacheOption } from "../Cache/ICacheOption";

export interface ISelectCacheOption extends ICacheOption {
    disableEntityAsTag?: boolean;
}
export interface IQueryOption {
    noQueryCache?: boolean;
    includeSoftDeleted?: boolean;
    supportTVP?: boolean;
    version?: Version;
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
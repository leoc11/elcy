import { Version } from "../../Common/Version";

export interface IQueryOption {
    noQueryCache?: boolean;
    includeSoftDeleted?: boolean;
    supportTVP?: boolean;
    version?: Version;
    // noTracking?: boolean;
    // batchSize?: number;
    // batchDelay?: number;
}
import { UpsertStrategy } from "src/Common/Enum";
import { ICacheOption } from "../Cache/ICacheOption";
import { ConcurrencyModel } from "../Common/StringType";
import { Version } from "../Common/Version";
import { CommitPlanConfig } from "src/Data/UOW/EntityCommitPlan";

export interface ISelectCacheOption extends ICacheOption {
    disableEntityAsTag?: boolean;
}
export interface IQueryOption {
    concurrencyMode?: ConcurrencyModel;
    supportTVP?: boolean;
    noQueryCache?: boolean;
    version?: Version;

    // delete
    forceHardDelete?: boolean;
    includeSoftDeleted?: boolean;
    softDeleteCascade?: boolean;
    // select
    resultCache?: "none" | ISelectCacheOption;
    // insert/update
    upsertStrategy?: UpsertStrategy;

    // noTracking?: boolean;
    // batchSize?: number;
    // batchDelay?: number;
}
export interface ISaveChangesOption extends IQueryOption {
    acceptAllChangesOnSuccess?: boolean;
}
export interface ICommitPlanOption extends ISaveChangesOption {
    commitConfig: CommitPlanConfig;
}
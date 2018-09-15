import { ICacheOption } from "../../Cache/ICacheOption";

export interface ISelectCacheOption extends ICacheOption {
    disableEntityAsTag?: boolean;
}

export interface IQueryOption {
    buildKey?: string;
    noQueryCache?: boolean;
    noTracking?: boolean;
    batchSize?: number;
    batchDelay?: number;
}
export interface ISelectQueryOption extends IQueryOption {
    includeSoftDeleted?: boolean;
    resultCache?: "none" | ISelectCacheOption;
}
export interface IInsertQueryIOption extends IQueryOption {
    
}
export interface IUpdateQueryOption extends IQueryOption {
    includeSoftDeleted?: boolean;
    useUpsert?: boolean;
}
export interface IDeleteQueryOption extends IQueryOption {
    forceHardDelete?: boolean;
}
export type ISaveChangesOption = ISelectQueryOption & IUpdateQueryOption & IDeleteQueryOption;

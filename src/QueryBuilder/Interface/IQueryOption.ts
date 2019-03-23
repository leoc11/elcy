import { ICacheOption } from "../../Cache/ICacheOption";

export interface ISelectCacheOption extends ICacheOption {
    disableEntityAsTag?: boolean;
}

export interface IQueryOption {
    noQueryCache?: boolean;
    includeSoftDeleted?: boolean;
    // noTracking?: boolean;
    // batchSize?: number;
    // batchDelay?: number;
}
export interface ISelectQueryOption extends IQueryOption {
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

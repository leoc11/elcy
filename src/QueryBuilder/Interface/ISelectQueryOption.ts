import { IsolationLevel } from "../../Common/Type";

export interface IQueryOption {
    buildKey?: string;
    noQueryCache?: boolean;
    noTracking?: boolean;
    isolationLevel?: IsolationLevel;
    batchSize?: number;
    batchDelay?: number;
}
export interface ISelectQueryOption extends IQueryOption {
    includeSoftDeleted: boolean;
}
export interface IUpdateQueryOption extends IQueryOption {
    includeSoftDeleted: boolean;
}
export interface IDeleteQueryOption extends IQueryOption {
    forceHardDelete: boolean;
}
export interface ISaveChangesOption {
    forceHardDelete: boolean;
    isolationLevel?: IsolationLevel;
    batchSize?: number;
    batchDelay?: number;
}

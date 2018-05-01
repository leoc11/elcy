export interface IQueryOption {
    recompile: boolean;
    isolationLevel: transactionIsolationLevel;
    userParameters?: Map<string, any>;
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
export type transactionIsolationLevel = "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE" | "SNAPSHOT";

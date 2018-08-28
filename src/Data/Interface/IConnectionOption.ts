export interface IConnectionOption {
    readonly host?: string;
    readonly port?: number;
    readonly user?: string;
    readonly password?: string;
    readonly database?: string;
    /**
     * The milliseconds before a timeout occurs during the initial connection to DB server.
     */
    readonly connectTimeout?: number;
    readonly requestTimeout?: number;
}
export interface IConnectionPoolOption {
    /**
     *  Maximum number of active connections created at any given time. (default: Infinity)
     */
    max?: number;
    /**
     * Minimum number of idle connections to keep in pool. (default: 0)
     */
    minQueue?: number;
    /**
     * Maximum number of idle connections to keep in pool. (default: 10)
     */
    maxQueue?: number;
    /**
     * Milliseconds before an idle connection is released from pool. (default: 30000)
     */
    idleTimeout?: number;
    /**
     * The order of connection removed from pool. (default: fifo)
     */
    queueType?: "fifo" | "lifo";
}
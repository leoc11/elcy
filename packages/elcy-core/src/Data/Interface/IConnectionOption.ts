export interface IConnectionOption {
    /**
     * The milliseconds before a timeout occurs during the initial connection to DB server.
     */
    readonly connectTimeout?: number;
    readonly database?: string;
    readonly host?: string;
    readonly password?: string;
    readonly port?: number;
    readonly requestTimeout?: number;
    readonly user?: string;
}
export interface IConnectionPoolOption {
    /**
     * Milliseconds to wait for a connection before an error is thrown. (default: 60000)
     */
    acquireTimeout?: number;
    /**
     * Milliseconds before an idle connection is released from pool. (default: 30000)
     */
    idleTimeout?: number;
    /**
     * Maximum number of idle connections to keep in pool. (default: 10)
     */
    max?: number;
    /**
     *  Maximum number of active connections created at any given time. (default: Infinity)
     */
    maxConnection?: number;
    /**
     * Minimum number of idle connections to keep in pool. (default: 0)
     */
    min?: number;
    /**
     * The order of connection removed from pool. (default: fifo)
     */
    queueType?: "fifo" | "lifo";
}

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
     * Minimum number of idle connections to keep in pool. (default: 0)
     */
    min?: number;
    /**
     * Maximum number of idle connections to keep in pool. (default: 10)
     */
    max?: number;
    /**
     *  Maximum number of active connections created at any given time. (default: Infinity)
     */
    maxConnection?: number;
    /**
     * Milliseconds before an idle connection is released from pool. (default: 30000)
     */
    idleTimeout?: number;
    /**
     * Milliseconds to wait for a connection before an error is thrown. (default: 60000)
     */
    acquireTimeout?: number;
    /**
     * The order of connection removed from pool. (default: fifo)
     */
    queueType?: "fifo" | "lifo";
}
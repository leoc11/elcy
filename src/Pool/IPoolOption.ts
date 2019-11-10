export interface IPoolOption {
    /**
     * Milliseconds to wait for a connection before an error is thrown. (default: 60000)
     */
    acquireTimeout?: number;
    /**
     * Milliseconds before an idle connection is released from pool. (default: 30000)
     */
    idleTimeout?: number;
    /**
     * Maximum number of idle resources to keep in pool. (default: 10)
     */
    max?: number;
    /**
     *  Maximum number of active resources created at any given time. (default: Infinity)
     */
    maxResource?: number;
    /**
     * Minimum number of idle resources to keep in pool. (default: max)
     */
    min?: number;
    /**
     * The order of idle resources removed from pool. (default: fifo)
     */
    queueType?: "fifo" | "lifo";
}

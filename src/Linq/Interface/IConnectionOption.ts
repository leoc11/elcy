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
    readonly poolOption?: IConnectionPoolOption;
}
export interface IConnectionPoolOption {
    /**
     * The maximum number of connections to create at once. (Default: 10)
     */
    readonly max?: number;
    /**
     * The maximum number of connection requests the pool will queue before returning an error from getConnection.
     */
    readonly queueLimit?: number;
    /**
     * The milliseconds before a timeout occurs during the connection acquisition. This is slightly different from connectTimeout,
     * because acquiring a pool connection does not always involve making a connection. (Default: 10 seconds)
     */
    readonly acquireTimeout?: number;
}
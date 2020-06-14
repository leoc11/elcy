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

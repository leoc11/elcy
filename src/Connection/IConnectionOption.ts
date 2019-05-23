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
}

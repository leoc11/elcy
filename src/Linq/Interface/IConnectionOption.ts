interface IConnectionOption {
    readonly host?: string;

    readonly port?: number;

    readonly username?: string;

    readonly password?: string;
    readonly database?: string;
    /**
     * The milliseconds before a timeout occurs during the initial connection to the MySQL server. (Default: 10000)
     */
    readonly connectTimeout?: number;
}

import { IConnectionOption } from "../../Data/Interface/IConnectionOption";
export interface ISqlServerConnectionOption extends IConnectionOption {
    readonly host: string;
    readonly driver?: string;
    /**
     * Once you set domain, driver will connect to SQL Server using domain login.
     */
    readonly domain?: string;
    /**
     *  Parse JSON recordsets to JS objects (default: false).
     */
    readonly parseJSON?: boolean;
    /**
     *  Request timeout in ms (default: 15000). NOTE: msnodesqlv8 driver doesn't support timeouts < 1 second.
     */
    readonly requestTimeout?: number;
    /**
     * Stream recordsets/rows instead of returning them all at once as an argument of callback (default: false).
     * You can also enable streaming for each request independently (request.stream = true).
     * Always set to true if you plan to work with large amount of rows.
     */
    readonly stream?: boolean;
    readonly options?: {
        encrypt?: boolean;
        instanceName?: string;
        useUTC?: boolean;
        tdsVersion?: string;
        appName?: string;
        abortTransactionOnError?: boolean;
        trustedConnection?: boolean;
    };
}

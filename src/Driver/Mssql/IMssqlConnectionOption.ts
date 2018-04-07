import { IConnectionOption, IConnectionPoolOption } from "../../Linq/Interface/IConnectionOption";
export interface IMssqlConnectionOption extends IConnectionOption {
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
    readonly poolOption?: IMssqlConnectionPoolOption;
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

export interface IMssqlConnectionPoolOption extends IConnectionPoolOption {
    /**
     * minimum number of resources to keep in pool at any given time. If this is set >= max, the pool will silently set the min to equal max. (default=0)
     */
    min?: number;
    /**
     * the minimum amount of time that an object may sit idle in the pool before it is eligible for eviction due to idle time. Supercedes softIdleTimeoutMillis Default: 30000
     */
    idleTimeoutMillis?: number;
    /**
     * should the pool validate resources before giving them to clients. Requires that either factory.validate or factory.validateAsync to be specified
     */
    testOnBorrow?: boolean;
    /**
     * if true the oldest resources will be first to be allocated. If false the most recently released resources will be the first to be allocated. This in effect turns the pool's behaviour from a queue into a stack. boolean, (default true)
     */
    fifo?: boolean;
    /**
     * int between 1 and x - if set, borrowers can specify their relative priority in the queue if no resources are available. see example. (default 1)
     */
    priorityRange?: number;
    /**
     * should the pool start creating resources, initialize the evictor, etc once the constructor is called. If false, the pool can be started by calling pool.start, otherwise the first call to acquire will start the pool. (default true)
     */
    autostart?: boolean;
    /**
     * How often to run eviction checks. Default: 0 (does not run).
     */
    evictionRunIntervalMillis?: number;
    /**
     *  Number of resources to check each eviction run. Default: 3.
     */
    numTestsPerRun?: number;
    /**
     * amount of time an object may sit idle in the pool before it is eligible for eviction by the idle object evictor (if any), with the extra condition that at least "min idle" object instances remain in the pool. Default -1 (nothing can get evicted)
     */
    softIdleTimeoutMillis?: number;
    /**
     * Promise lib, a Promises/A+ implementation that the pool should use. Defaults to whatever global.Promise is (usually native promises).
     */
    Promise?: any;
}
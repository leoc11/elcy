import { ILogger, LogSeverity } from "./ILogger";

export class DefaultLogger implements ILogger {
    constructor(private excludeSource?: boolean) {

    }
    public log(source: any, level: LogSeverity, message: string, error?: Error, ...args: any[]): void {
        if (!this.excludeSource) {
            args.unshift(source);
        }
        if (error) {
            args.unshift(error);
        }
        switch (level) {
            case "error": {
                console.error(message, args);
                break;
            }
            case "warn": {
                console.warn(message, args);
                break;
            }
            case "debug": {
                console.debug(message, args);
                break;
            }
            case "info": {
                console.info(message, args);
                break;
            }
            case "trace": {
                console.trace(message, args);
                break;
            }
            default: {
                console.log(message, args);
                break;
            }
        }
    }
}

export type LogSeverity = "trace" | "debug" | "info" | "warn" | "error";

export interface ILogger {
    log(source: any, level: LogSeverity, message: string, error?: Error, ...args: any[]): void;
}

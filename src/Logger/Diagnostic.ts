import { container } from "../IOC/Container";
import { ILogger } from "./ILogger";
import { Timer } from "./Timer";

export abstract class Diagnostic {
    private static get logger() {
        return container.resolve<ILogger>("logger");
    }
    public static get enabled() {
        return !!Diagnostic.logger;
    }
    public static timer(): Timer | undefined {
        if (!Diagnostic.enabled) return undefined;

        const res = new Timer();
        res.start();
        return res;
    }
    public static trace(source: any, message: string, ...args: any[]): void;
    public static trace(source: any, message: string, error?: Error, ...args: any[]): void;
    public static trace(source: any, message: string, error?: Error | any, ...args: any[]): void {
        if (!Diagnostic.enabled) return;

        if (error && !(error instanceof Error)) {
            args.unshift(error);
            error = null;
        }
        Diagnostic.logger.log(source, "trace", message, error, args);
    }

    public static debug(source: any, message: string, ...args: any[]): void;
    public static debug(source: any, message: string, error?: Error, ...args: any[]): void {
        if (!Diagnostic.enabled) return;

        if (error && !(error instanceof Error)) {
            args.unshift(error);
            error = null;
        }
        Diagnostic.logger.log(source, "debug", message, error, args);
    }

    public static info(source: any, message: string, ...args: any[]): void;
    public static info(source: any, message: string, error?: Error, ...args: any[]): void {
        if (!Diagnostic.enabled) return;

        if (error && !(error instanceof Error)) {
            args.unshift(error);
            error = null;
        }
        Diagnostic.logger.log(source, "info", message, error, args);
    }

    public static warn(source: any, message: string, ...args: any[]): void;
    public static warn(source: any, message: string, error?: Error, ...args: any[]): void {
        if (!Diagnostic.enabled) return;

        if (error && !(error instanceof Error)) {
            args.unshift(error);
            error = null;
        }
        Diagnostic.logger.log(source, "warn", message, error, args);
    }

    public static error(source: any, message: string, error?: Error, ...args: any[]): void;
    public static error(source: any, message: string, ...args: any[]): void;
    public static error(source: any, message: string, error?: Error, ...args: any[]): void {
        if (!Diagnostic.enabled) return;

        if (error && !(error instanceof Error)) {
            args.unshift(error);
            error = null;
        }
        Diagnostic.logger.log(source, "error", message, error, args);
    }
}

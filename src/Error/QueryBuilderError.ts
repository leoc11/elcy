import { CodedError } from "./CodedError";

export enum QueryBuilderErrorCode {
    UsageIssue = 0,
    NotSupported = 1,
}
/**
 * Error throwed by Driver goes here. (all query related error)
 */
export class QueryBuilderError extends CodedError {
    constructor(code: number, message: string);
    constructor(code: number, error: Error);
    constructor(code: number, messageOrError: string | Error) {
        super(code, messageOrError as any);
    }
}
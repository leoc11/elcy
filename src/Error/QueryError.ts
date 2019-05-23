import { CodedError } from "./CodedError";

/**
 * Error throwed by Driver goes here. (all query related error)
 */
export class QueryError extends CodedError {
    constructor(code: number, message: string);
    constructor(code: number, error: Error);
    constructor(code: number, messageOrError: string | Error) {
        super(code, messageOrError as any);
    }
}

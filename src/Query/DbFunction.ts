import { CodedError } from "../Error/CodedError";

export const DbFunction = {
    lastInsertedId: function(): any {
        throw new CodedError(1, "Unsupported operation");
    },
    coalesce: function <T>(...items: T[]): T {
        return items.first((o) => o !== undefined && o !== null);
    }
};

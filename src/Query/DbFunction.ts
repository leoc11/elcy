export const DbFunction = {
    /* istanbul ignore next */
    lastInsertedId: function (): any {
        throw new Error("Unsupported operation");
    },
    coalesce: function <T>(...items: T[]): T {
        return items.first((o) => o !== undefined && o !== null);
    }
};

export const DbFunction = {
    lastInsertedId: function (): any {
        return null;
    },
    coalesce: function <T>(...items: T[]): T {
        return items.first(o => o !== undefined && o !== null);
    }
};

import "./EnumerableExtension";
declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        add(...items: T[]): void;
        remove(...items: T[]): void;
        each(executor: (item: T, index: number) => void): void;
        eachAsync(executor: (item: T, index: number) => Promise<void>): Promise<void>;
        selectAwait<TReturn>(selector: (item: T) => Promise<TReturn>): Promise<TReturn[]>;
        toMap<TKey>(keySelector: (item: T) => TKey): Map<TKey, T>;
    }
}

Array.prototype.add = function <T>(this: T[], ...items: T[]) {
    for (const item of items) {
        if (!this.contains(item))
            this.push(item);
    }
};
Array.prototype.remove = function <T>(this: T[], ...items: T[]) {
    for (const item of items) {
        const index = this.indexOf(item);
        if (index >= 0) {
            this.splice(index, 1);
        }
    }
};
Array.prototype.each = function <T>(this: T[], executor: (item: T, index: number) => void) {
    let index = 0;
    for (const item of this) {
        executor(item, index++);
    }
};
Array.prototype.eachAsync = async function <T>(this: T[], executor: (item: T, index: number) => Promise<void>) {
    let index = 0;
    for (const item of this) {
        await executor(item, index++);
    }
};
Array.prototype.toMap = function <T, TKey>(this: T[], keySelector: (item: T) => TKey) {
    const result = new Map();
    for (const item of this) {
        result.set(keySelector(item), item);
    }
    return result;
};

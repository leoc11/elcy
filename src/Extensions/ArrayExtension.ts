
// tslint:disable-next-line:interface-name
interface Array<T> {
    add(...items: T[]): void;
    delete(...items: T[]): void;
    toMap<K, V = T>(keySelector: (item: T) => K, valueSelector?: (item: T) => V): Map<K, V>;
}

Array.prototype.add = function <T>(this: T[], ...items: T[]) {
    for (const item of items) {
        if (!this.contains(item))
            this.push(item);
    }
};
Array.prototype.delete = function <T>(this: T[], ...items: T[]) {
    for (const item of items) {
        const index = this.indexOf(item);
        if (index >= 0) {
            this.splice(index, 1);
        }
    }
};
Array.prototype.toMap = function <T, K, V>(this: T[], keySelector: (item: T) => K, valueSelector?: (item: T) => V) {
    const result = new Map();
    for (const item of this) {
        result.set(keySelector(item), valueSelector ? valueSelector(item) : item);
    }
    return result;
};

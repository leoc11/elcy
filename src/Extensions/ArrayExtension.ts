// tslint:disable-next-line:interface-name
interface Array<T> {
    add(...items: T[]): void;
    delete(...items: T[]): boolean;
    deleteAll(predicate: (item: T) => boolean): T[];
}

Array.prototype.add = function <T>(this: T[], ...items: T[]) {
    for (const item of items) {
        if (!this.contains(item)) {
            this.push(item);
        }
    }
};
Array.prototype.delete = function <T>(this: T[], ...items: T[]) {
    for (const item of items) {
        const index = this.indexOf(item);
        if (index >= 0) {
            this.splice(index, 1);
            return true;
        }
    }
    return false;
};
Array.prototype.deleteAll = function <T>(this: T[], predicate: (item: T) => boolean) {
    const result = [];
    for (let i = 0, len = this.length; i < len; i++) {
        const item = this[i];
        if (predicate(item)) {
            result.push(item);
            this.splice(i, 1);
            i--;
        }
    }
    return result;
};

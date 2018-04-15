import "./EnumerableExtension";
declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        add(...items: T[]): void;
        remove(...items: T[]): void;
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

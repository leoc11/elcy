export { };
declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        add(...items: T[]): void;
        delete(...items: T[]): void;
    }
}

Array.prototype.add = function <T>(this: T[], ...items: T[]) {
    ArrayExtension.add(this, ...items);
};
Array.prototype.delete = function <T>(this: T[], ...items: T[]) {
    ArrayExtension.delete(this, ...items);
};

export class ArrayExtension {
    static delete<T>(array: T[], ...items: T[]) {
        for (const item of items) {
            const index = array.indexOf(item);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
    }
    static add<T>(array: T[], ...items: T[]) {
        for (const item of items) {
            if (!array.contains(item)) {
                array.push(item);
            }
        }
    }
}
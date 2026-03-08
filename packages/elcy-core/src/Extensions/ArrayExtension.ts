import { Enumerable, IEnumerable } from "@elcy/enumerable";

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
            if (!array.includes(item)) {
                array.push(item);
            }
        }
    }
    static asArray<T>(array: IEnumerable<T>): T[] {
        if (Array.isArray(array)) {
            return array;
        }

        return Enumerable.from(array).toArray();
    }
}
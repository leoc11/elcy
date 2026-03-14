export class SortedArray<T> extends Array<T> {
    public set length(value: number) {
        this.splice(value);
    }
    public constructor(protected comparator: (item1: T, item2: T) => number, ...items: T[]) {
        super(...items);
        Object.setPrototypeOf(this, SortedArray.prototype);
    }
    public static create<T>(compareFunction: (item1: T, item2: T) => number, ...items: T[]): SortedArray<T> {
        return new SortedArray(compareFunction, ...items);
    }
    public push(...items: T[]) {
        for (const o of items) {
            this.addItem(o);
        }
        return this.length;
    }
    public splice(start: number, deleteCount?: number, ...items: T[]) {
        const result: T[] = typeof deleteCount === "undefined" ? super.splice(start) : super.splice(start, deleteCount);
        for (const o of items) {
            this.addItem(o);
        }
        return result;
    }
    public unshift(...items: T[]) {
        for (const o of items) {
            this.addItem(o);
        }
        return this.length;
    }
    protected addItem(item: T, start = 0, end = this.length - 1) {
        if (this.length <= 0) {
            super.push(item);
        }
        else if (this.comparator(this[start], item) > 0) {
            super.unshift(item);
        }
        else if (this.comparator(this[end], item) <= 0) {
            super.push(item);
        }
        else {
            while (start < end) {
                const half = Math.floor(start + end / 2);
                const halfItem = this[half];
                if (this.comparator(item, halfItem) > 0) {
                    start = start === half ? half + 1 : half;
                }
                else if (this.comparator(item, halfItem) < 0) {
                    end = half;
                }
                else {
                    start = end = half;
                }
            }
            super.splice(start, 0, item);
        }
    }
}

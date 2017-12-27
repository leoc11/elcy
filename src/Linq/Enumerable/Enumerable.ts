export class Enumerable<T = any> extends Array<T> {
    protected parent?: Enumerable | any[];
    protected pointer = 0;
    constructor(items: T[] | Enumerable) {
        super();
        this.parent = items;
    }
    public [Symbol.iterator](): Enumerable<T> {
        return this;
    }

    public next() {
        if (this.pointer < this.length) {
            return {
                done: this.pointer >= this.length,
                value: this[this.pointer]
            };
        }
        if (this.parent) {
            const result: IteratorResult<T> = {
                done: this.pointer >= this.parent.length,
                value: this.parent[this.pointer]
            };
            if (!result.done)
                this[this.pointer] = result.value;
            this.pointer++;
            return result;
        }

        return {
            done: this.pointer >= this.length,
            value: this[this.pointer]
        };
    }
}

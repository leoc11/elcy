import { Enumerable } from "./Enumerable";

export class SelectManyEnumerable<T = any, K = any> extends Enumerable<K> {
    public innerResult: Enumerable<K>;
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => K[] | Enumerable<K>) {
        super();
    }
    public [Symbol.iterator]() {
        return this;
    }
    public next(): IteratorResult<K> {
        let result: IteratorResult<K> = {
            done: this.result.length < this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done) {
            if (this.innerResult)
                result = this.innerResult.next();

            if (result.done) {
                const presult = this.parent.next();
                if (presult.done)
                    return presult as IteratorResult<any>;
                const innerArray = this.selector(presult.value);
                this.innerResult = Array.isArray(innerArray) ? new Enumerable(innerArray) : innerArray;
                result = this.innerResult.next();
                if (result.done)
                    return result;
            }
            this.result[this.pointer] = result.value;
        }
        this.pointer++;
        return result;
    }
    public prev(): IteratorResult<K> {
        let result: IteratorResult<K> = {
            done: true,
            value: this.result[-1]
        };
        if (this.innerResult)
            result = this.innerResult.prev();

        if (result.done) {
            const presult = this.parent.prev();
            if (presult.done)
                return presult as IteratorResult<any>;

            const innerArray = this.selector(presult.value);
            this.innerResult = Array.isArray(innerArray) ? new Enumerable(innerArray) : innerArray;
            result = this.innerResult.prev();
            if (result.done)
                return result;
        }
        this.reversepointer++;
        return result;
    }
}

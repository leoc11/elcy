import { Enumerable } from "./Enumerable";

export class TakeEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly takeCount: number) {
        super();
    }
    protected *generator() {
        const result: T[] = [];
        let index = 0;
        for (const value of this.parent) {
            result.push(value);
            yield value;
            if (++index >= this.takeCount)
                break;
        }
        this.result = result;
        this.isResultComplete = true;
    }
}

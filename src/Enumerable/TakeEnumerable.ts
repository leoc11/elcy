import { Enumerable } from "./Enumerable";

export class TakeEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly takeCount: number) {
        super();
    }
    protected *generator() {
        const result: T[] = [];
        let index = 0;
        for (const value of this.parent) {
            if (index >= this.takeCount)
                break;

            result.push(value);
            yield value;
        }
        this.result = result;
        this.isResultComplete = true;
    }
}

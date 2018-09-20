import { Enumerable } from "./Enumerable";

export class TakeEnumerable<T = any> extends Enumerable<T> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly takeCount: number) {
        super();
    }
    protected *generator() {
        let result: T[];
        if (this.enableCache) result = [];
        let index = 0;
        for (const value of this.parent) {
            if (this.enableCache) result.push(value);
            yield value;
            if (++index >= this.takeCount)
                break;
        }
        if (this.enableCache) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
}

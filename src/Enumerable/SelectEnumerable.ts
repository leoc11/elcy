import { Enumerable } from "./Enumerable";
import { IObjectType } from "../Common/Type";

export class SelectEnumerable<T = any, K = any> extends Enumerable<K> {
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => K, protected readonly type?: IObjectType<K>) {
        super();
    }
    protected *generator() {
        let result: K[];
        if (this.enableCache) result = [];
        for (const value1 of this.parent) {
            let value = this.selector(value1);
            if (this.type && !(value.constructor instanceof this.type)) {
                value = Object.assign(new this.type(), value);
            }
            if (this.enableCache) result.push(value);
            yield value;
        }
        if (this.enableCache) {
            this.result = result;
            this.isResultComplete = true;
        }
    }
}

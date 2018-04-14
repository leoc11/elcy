import { OrderDirection } from "../../Common/Type";
import { Enumerable } from "./Enumerable";
import { IOrderDefinition } from "../Interface/IOrderDefinition";

// reference : http://faithlife.codes/blog/2010/04/a_truly_lazy_orderby_in_linq/
interface IRange {
    first: number;
    last: number;
}
function* lazysort<T>(enumerable: Enumerable<T>, ...selectors: IOrderDefinition<T>[]) {
    let index = 0;
    enumerable.resetPointer();
    const array = enumerable.toArray();
    const comparers = (a: any, b: any) => {
        for (const selector of selectors) {
            const aVal = selector.selector(a);
            const bVal = selector.selector(b);
            // tslint:disable-next-line:triple-equals
            if (aVal == bVal)
                continue;
            return (aVal > bVal ? 1 : -1) * (selector.direction === OrderDirection.DESC ? -1 : 1);
        }
        return 0;
    };
    const partition = (source: T[], first: number, last: number) => {
        let left = first - 1;
        let right = last + 1;
        while (true) {
            do {
                right--;
            } while (comparers(source[right], source[first]) > 0);
            do {
                left++;
            } while (comparers(source[left], source[first]) < 0);

            if (left < right) {
                const temp = source[left];
                source[left] = source[right];
                source[right] = temp;
            }
            else {
                return right;
            }
        }
    };
    const stack: IRange[] = [];
    stack.push({ first: 0, last: array.length - 1 });
    while (stack.length > 0) {
        const currentRange = stack.pop() as IRange;
        if (currentRange.last - currentRange.first === 0) {
            yield array[index];
            index++;
        }
        else {
            const pivotIndex = partition(array, currentRange.first, currentRange.last);
            stack.push({ first: pivotIndex + 1, last: currentRange.last });
            stack.push({ first: currentRange.first, last: pivotIndex });
        }
    }
}
export class OrderEnumerable<T = any> extends Enumerable<T> {
    private generator: IterableIterator<any>;
    protected readonly selectors: IOrderDefinition<T>[];
    constructor(protected readonly parent: Enumerable<T>, ...selectors: IOrderDefinition<T>[]) {
        super();
        this.selectors = selectors;
    }
    public [Symbol.iterator]() {
        return this;
    }

    public next(): IteratorResult<T> {
        if (!this.generator) {
            this.setGenerator();
        }
        let result: IteratorResult<T> = {
            done: this.result.length <= this.pointer,
            value: this.result[this.pointer]
        };
        if (result.done && !this.isResultComplete) {
            result = this.generator.next();
            if (result.done) {
                this.isResultComplete = true;
                this.resetPointer();
                return result;
            }
            this.result[this.pointer] = result.value;
        }
        result.done ? this.resetPointer() : this.pointer++;
        return result;
    }
    public resetPointer(cleanReset = false) {
        super.resetPointer(cleanReset);
        if (cleanReset)
            this.setGenerator();
    }
    protected setGenerator() {
        this.generator = lazysort(this.parent, ...this.selectors);
    }
}

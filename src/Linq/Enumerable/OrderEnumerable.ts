import { OrderDirection } from "../../Common/Type";
import { Enumerable } from "./Enumerable";

interface IRange {
    first: number;
    last: number;
}
function* lazysort<T>(enumerable: Enumerable<T>, selector: (item: T) => any, direction: OrderDirection) {
    let index = 0;
    enumerable.resetPointer();
    const array = enumerable.toArray();
    const comparer = (a: any, b: any) => (a > b ? 1 : a < b ? -1 : 0) * (direction === "ASC" ? 1 : -1);
    const partition = (source: T[], first: number, last: number) => {
        const pivot = selector(source[first]);
        let left = first - 1;
        let right = last + 1;
        while (true) {
            do {
                right--;
            } while (comparer(selector(source[right]), pivot) > 0);
            do {
                left++;
            } while (comparer(selector(source[left]), pivot) < 0);

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
    constructor(protected readonly parent: Enumerable<T>, protected readonly selector: (item: T) => any, protected readonly direction: OrderDirection) {
        super();
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
        this.generator = lazysort(this.parent, this.selector, this.direction);
    }
}

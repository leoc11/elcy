import { OrderDirection } from "../Common/Type";
import { Enumerable } from "./Enumerable";
import { IOrderDefinition } from "./Interface/IOrderDefinition";

// reference : http://faithlife.codes/blog/2010/04/a_truly_lazy_orderby_in_linq/
interface IRange {
    first: number;
    last: number;
}
export class OrderEnumerable<T = any> extends Enumerable<T> {
    protected readonly selectors: IOrderDefinition<T>[];
    constructor(protected readonly parent: Enumerable<T>, ...selectors: IOrderDefinition<T>[]) {
        super();
        this.selectors = selectors;
    }
    protected *generator() {
        let index = 0;
        const result: T[] = [];
        const array = this.parent.toArray();
        const comparers = (a: any, b: any) => {
            for (const selector of this.selectors) {
                const aVal = selector[0](a);
                const bVal = selector[0](b);
                // tslint:disable-next-line:triple-equals
                if (aVal == bVal)
                    continue;
                return (aVal > bVal ? 1 : -1) * (selector[1] === OrderDirection.DESC ? -1 : 1);
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
                const value = array[index++];
                result.push(value);
                yield value;
            }
            else {
                const pivotIndex = partition(array, currentRange.first, currentRange.last);
                stack.push({ first: pivotIndex + 1, last: currentRange.last });
                stack.push({ first: currentRange.first, last: pivotIndex });
            }
        }

        this.result = result;
        this.isResultComplete = true;
    }
}

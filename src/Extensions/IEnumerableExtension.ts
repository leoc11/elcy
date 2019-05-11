import { Enumerable } from "../Enumerable/Enumerable";

declare global {
    interface Array<T> {
        each(executor: (item: T, index: number) => void): void;
    }
    interface Enumerable<T> {
        each(executor: (item: T, index: number) => void): void;
    }
}
Array.prototype.each = Array.prototype.forEach;

Enumerable.prototype.each = function <T>(this: Enumerable<T>, executor: (item: T, index: number) => void) {
    let i = 0;
    for (const item of this) {
        executor(item, i++);
    }
};

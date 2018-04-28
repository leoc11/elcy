import { Enumerable } from "../Enumerable/Enumerable";
import "../Enumerable/Enumerable.partial";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        include(...includes: Array<(item: T) => any>): T[];
    }
}
declare module "../Enumerable/Enumerable" {
    interface Enumerable<T> {
        include(...includes: Array<(item: T) => any>): Enumerable<T>;
    }
}

Array.prototype.include = function <T>(this: T[], ...includes: Array<(item: T) => any>): T[] {
    return this;
};
Enumerable.prototype.include = function <T>(this: Enumerable<T>, ...includes: Array<(item: T) => any>): Enumerable<T> {
    return this;
};
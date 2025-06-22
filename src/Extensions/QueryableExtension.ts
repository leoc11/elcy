import { Enumerable } from "../Enumerable/Enumerable";
import { Queryable } from "../Queryable/Queryable";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        include(...includes: Array<(item: T) => unknown>): T[];
        project(...includes: Array<(item: T) => unknown>): T[];
    }
}
Array.prototype.include = function <T>(this: T[]): T[] {
    return this;
};
Array.prototype.project = function <T>(this: T[]): T[] {
    return this;
};

declare module "../Enumerable/Enumerable" {
    interface Enumerable<T> {
        include(...includes: Array<(item: T) => unknown>): Enumerable<T>;
        project(...includes: Array<(item: T) => unknown>): Enumerable<T>;
    }
}
Enumerable.prototype.include = function <T>(this: Enumerable<T>): Enumerable<T> {
    return this;
};
Enumerable.prototype.project = function <T>(this: Enumerable<T>): Enumerable<T> {
    return this;
};

declare module "../Queryable/Queryable" {
    interface Queryable<T> {
        asSubquery(): Enumerable<T>;
    }
}
Queryable.prototype.asSubquery = function <T>(this: Queryable<T>): Enumerable<T> {
    return this as unknown as Enumerable<T>;
};

import { GroupArray } from "./GroupArray";
declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        selectMany<TReturn>(fn: (item: T) => TReturn[]): TReturn[];
        select<TReturn>(fn: (item: T) => TReturn): TReturn[];
        contains(item: T): boolean;
        first(fn?: (item: T) => boolean): T;
        last(fn?: (item: T) => boolean): T;
        where(fn: (item: T) => boolean): T[];
        orderBy(fn: (item: T) => any, orderDirection: "asc" | "desc"): T[];
        any(fn?: (item: T) => boolean): boolean;
        all(fn?: (item: T) => boolean): boolean;
        skip(n: number): T[];
        take(n: number): T[];
        sum(fn?: (item: T) => number): number;
        count(): number;
        avg(fn?: (item: T) => number): number;
        max(fn?: (item: T) => number): number;
        min(fn?: (item: T) => number): number;
        groupBy<KType>(fn: (item: T) => KType): Array<GroupArray<KType, T>>;
        distinct<TKey>(fn?: (item: T) => TKey): T[];
        innerJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult): TResult[];
        leftJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2?: T2) => TResult): TResult[];
        rightJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | undefined, item2: T2) => TResult): TResult[];
        fullJoin<T2, TKey, TResult>(array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | undefined, item2?: T2) => TResult): TResult[];
        union(array2: T[], all: boolean): T[];
        /**
         * Return array of item exist in both source array and array2.
         */
        intersect(array2: T[]): T[];
        /**
         * Return array of item exist in both source array and array2.
         */
        except(array2: T[]): T[];
        pivot<TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(dimensions: TD, metric: TM): TResult[];
    }
}

Array.prototype.selectMany = function <T>(this: T[], fn: (item: T) => any[]) {
    let result: T[] = [];
    for (const item of this) {
        result = result.concat(fn(item));
    }
    return result;
};
Array.prototype.select = function <T>(this: T[], fn: (item: T) => any) {
    const result = [];
    for (const item of this) {
        result.push(fn(item));
    }
    return result;
};
Array.prototype.contains = function <T>(this: T[], item: T) {
    return this.indexOf(item) >= 0;
};
Array.prototype.where = function <T>(this: T[], fn: (item: T) => boolean) {
    return this.filter(fn);
};
Array.prototype.orderBy = function <T>(this: T[], fn: (item: T) => any, orderDirection: "asc" | "desc" = "asc") {
    return this.sort((a, b) => {
        const aVal = fn(a);
        const bVal = fn(b);
        return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * (orderDirection === "asc" ? 1 : -1);
    });
};
Array.prototype.first = function <T>(this: T[], fn?: (item: T) => boolean) {
    if (!fn)
        fn = () => true;
    return this.where(fn)[0];
};
Array.prototype.last = function <T>(this: T[], fn?: (item: T) => boolean) {
    if (!fn)
        fn = () => true;
    const result = this.where(fn);
    return result[result.length - 1];
};
Array.prototype.any = function <T>(this: T[], fn?: (item: T) => boolean) {
    if (!fn)
        fn = () => true;
    return this.some(fn);
};
Array.prototype.all = function <T>(this: T[], fn: (item: T) => boolean) {
    if (!fn)
        fn = () => true;
    return this.every(fn);
};
Array.prototype.skip = function <T>(this: T[], n: number) {
    return this.slice(n);
};
Array.prototype.take = function <T>(this: T[], n: number) {
    return this.slice(0, n);
};
Array.prototype.sum = function <T>(this: T[], fn?: (item: T) => number) {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return arrayVal.reduce((a, b) => a + b, 0);
};
Array.prototype.avg = function <T>(this: T[], fn?: (item: T) => number) {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return arrayVal.sum() / arrayVal.count();
};
Array.prototype.max = function <T>(this: T[], fn?: (item: T) => number) {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return Math.max.apply(Math, arrayVal);
};

Array.prototype.min = function <T>(this: T[], fn?: (item: T) => number) {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return Math.min.apply(Math, arrayVal);
};
Array.prototype.count = function <T>(this: T[]) {
    return this.length;
};
Array.prototype.groupBy = function <T, TKey>(this: T[], fn: (item: T) => TKey): Array<GroupArray<TKey, T>> {
    const result: Array<GroupArray<TKey, T>> = [];
    for (const item of this) {
        const key = fn(item);
        let group = result.first((o) => JSON.stringify(o.Key) === JSON.stringify(key));
        if (!group) {
            group = new GroupArray(key);
            result.push(group);
        }
        group.push(item);
    }
    return result;
};
Array.prototype.distinct = function <T>(this: T[], fn?: (item: T) => any) {
    if (!fn) {
        fn = (o) => o;
    }

    return this.groupBy(fn).selectMany((o) => [o[0]]);
};
Array.prototype.innerJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2: T2) => TResult) {
    return this.selectMany((item1) => {
        const key1 = keySelector1(item1);
        const matched = array2.where((item2) => JSON.stringify(keySelector2(item2)) === JSON.stringify(key1));
        return matched.select((item2) => {
            return resultSelector(item1, item2);
        });
    });
};
Array.prototype.leftJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T, item2?: T2) => TResult) {
    return this.selectMany((item1) => {
        const key1 = keySelector1(item1);
        const matched = array2.where((item2) => JSON.stringify(keySelector2(item2)) === JSON.stringify(key1));
        if (matched.length === 0)
            return [resultSelector(item1)];
        return matched.select((item2) => {
            return resultSelector(item1, item2);
        });
    });
};
Array.prototype.rightJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | undefined, item2: T2) => TResult) {
    return array2.selectMany((item2) => {
        const key2 = keySelector2(item2);
        const matched = this.where((item1) => JSON.stringify(keySelector1(item1)) === JSON.stringify(key2));
        if (matched.length === 0)
            return [resultSelector(undefined, item2)];
        return matched.select((item1) => {
            return resultSelector(item1, item2);
        });
    });
};
Array.prototype.fullJoin = function <T, T2, TKey, TResult>(this: T[], array2: T2[], keySelector1: (item: T) => TKey, keySelector2: (item: T2) => TKey, resultSelector: (item1: T | undefined, item2?: T2) => TResult) {
    const result = this.selectMany((item1) => {
        const key1 = keySelector1(item1);
        const matched = array2.where((item2) => JSON.stringify(keySelector2(item2)) === JSON.stringify(key1));
        if (matched.length === 0)
            return [resultSelector(item1)];
        return matched.select((item2) => {
            return resultSelector(item1, item2);
        });
    });
    const leftArray2 = array2.where((item2) => {
        const key2 = keySelector2(item2);
        return this.all((item1) => JSON.stringify(keySelector1(item1)) !== JSON.stringify(key2));
    }).select((item2) => resultSelector(undefined, item2));

    return result.concat(leftArray2);
};
Array.prototype.union = function <T>(this: T[], array2: T[], all: boolean = false) {
    let result = this.concat(array2);
    if (!all)
        result = result.distinct();

    return result;
};
Array.prototype.intersect = function <T>(this: T[], array2: T[]) {
    return this.where((item1) => {
        return array2.any((item2) => JSON.stringify(item2) === JSON.stringify(item1));
    });
};
Array.prototype.except = function <T>(this: T[], array2: T[]) {
    return this.where((item1) => {
        return !array2.any((item2) => JSON.stringify(item2) === JSON.stringify(item1));
    });
};
Array.prototype.pivot = function <T, TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T[]) => any }, TResult extends {[key in (keyof TD & keyof TM)]: any }>(this: T[], dimensions: TD, metrics: TM) {
    const dataResult: Array<GroupArray<TResult, any>> = [];
    for (const item of this) {
        const dimensionKey = {} as TResult;
        // tslint:disable-next-line:forin
        for (const key in dimensions) {
            dimensionKey[key] = dimensions[key](item);
        }
        let group = dataResult.first((o) => JSON.stringify(o.Key) === JSON.stringify(dimensionKey));
        if (!group) {
            group = new GroupArray<TResult, any>(dimensionKey);
            dataResult.push(group);
        }
        group.push(item);
    }

    return dataResult.select((o) => {
        for (const key in metrics) {
            if (o.Key)
                o.Key[key] = metrics[key](o);
        }
        return o.Key as TResult;
    });
};

import { GroupArray } from "./GroupArray";
declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        selectMany<TReturn>(fn: (item: T) => TReturn[]): TReturn[];
        select<TReturn>(fn: (item: T) => TReturn): TReturn[];
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
        innerJoin<T2, TResult>(array2: T2[], keySelector1: (item: T) => any, keySelector2: (item: T2) => any, resultSelector: (item1: T, item2: T2) => TResult): TResult[];
        leftJoin<T2, TResult>(array2: T2[], keySelector1: (item: T) => any, keySelector2: (item: T2) => any, resultSelector: (item1: T, item2?: T2) => TResult): TResult[];
        rightJoin<T2, TResult>(array2: T2[], keySelector1: (item: T) => any, keySelector2: (item: T2) => any, resultSelector: (item1: T | undefined, item2: T2) => TResult): TResult[];
        fullJoin<T2, TResult>(array2: T2[], keySelector1: (item: T) => any, keySelector2: (item: T2) => any, resultSelector: (item1: T | undefined, item2?: T2) => TResult): TResult[];
        union(array2: T[], all: boolean): T[];
        intersect(array2: T[]): T[];
        except(array2: T[]): T[];
        pivot<TD extends { [key: string]: (item: T) => any }, TM extends { [key: string]: (item: T) => any }>(dimensions: TD, metric: TM): Array<TD & TM>;
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
Array.prototype.last = (fn?: (item) => boolean) => {
    if (!fn)
        fn = () => true;
    const result = this.where(fn);
    return result[result.length - 1];
};
Array.prototype.any = (fn?: (item) => boolean) => {
    if (!fn)
        fn = () => true;
    return this.some(fn);
};
Array.prototype.all = (fn: (item) => boolean) => {
    if (!fn)
        fn = () => true;
    return this.every(fn);
};
Array.prototype.skip = (n: number) => {
    return this.slice(n);
};
Array.prototype.take = (n: number) => {
    return this.slice(0, n);
};
Array.prototype.sum = (fn?: (item) => number) => {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return arrayVal.reduce((a, b) => a + b, 0);
};
Array.prototype.avg = (fn?: (item) => number) => {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return arrayVal.sum() / arrayVal.count();
};
Array.prototype.max = (fn?: (item: any) => number) => {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return Math.max.apply(Math, arrayVal);
};

Array.prototype.min = (fn?: (item: any) => number) => {
    let arrayVal: any[] = this;
    if (fn)
        arrayVal = arrayVal.select(fn);

    return Math.min.apply(Math, arrayVal);
};
Array.prototype.count = () => {
    return this.length;
};
Array.prototype.groupBy = (fn: (item) => any): Array<GroupArray<any, any>> => {
    const result: Array<GroupArray<any, any>> = [];
    for (const item of this) {
        const key = fn(item);
        let group = result.first((o) => JSON.stringify(o.Key) === JSON.stringify(key));
        if (!group) {
            group = new GroupArray();
            result.push(group);
        }
        group.push(item);
    }
    return result;
};
Array.prototype.distinct = (fn?: (item) => any) => {
    if (!fn) {
        fn = (o) => o;
    }

    return this.groupBy(fn).selectMany((o) => o[0]);
};
Array.prototype.innerJoin = (array2: any[], keySelector1: (item) => any, keySelector2: (item) => any, resultSelector: (item1, item2) => any) => {
    return this.selectMany((item1) => {
        const key1 = keySelector1(item1);
        const matched = array2.select((item2) => JSON.stringify(keySelector2(item2)) === JSON.stringify(key1));
        return matched.select((item2) => {
            return resultSelector(item1, item2);
        });
    });
};
Array.prototype.leftJoin = (array2: any[], keySelector1: (item) => any, keySelector2: (item) => any, resultSelector: (item1, item2?) => any) => {
    return this.selectMany((item1) => {
        const key1 = keySelector1(item1);
        const matched = array2.select((item2) => JSON.stringify(keySelector2(item2)) === JSON.stringify(key1));
        if (matched.length === 0)
            return [resultSelector(item1)];
        return matched.select((item2) => {
            return resultSelector(item1, item2);
        });
    });
};
Array.prototype.rightJoin = (array2: any[], keySelector1: (item) => any, keySelector2: (item) => any, resultSelector: (item1, item2) => any) => {
    const that = this;
    return array2.selectMany((item2) => {
        const key2 = keySelector2(item2);
        const matched = that.select((item1) => JSON.stringify(keySelector1(item1)) === JSON.stringify(key2));
        if (matched.length === 0)
            return [resultSelector(undefined, item2)];
        return matched.select((item1) => {
            return resultSelector(item1, item2);
        });
    });
};
Array.prototype.fullJoin = (array2: any[], keySelector1: (item) => any, keySelector2: (item) => any, resultSelector: (item1, item2?) => any) => {
    const array1 = this;
    const result = this.selectMany((item1) => {
        const key1 = keySelector1(item1);
        const matched = array2.select((item2) => JSON.stringify(keySelector2(item2)) === JSON.stringify(key1));
        if (matched.length === 0)
            return [resultSelector(item1)];
        return matched.select((item2) => {
            return resultSelector(item1, item2);
        });
    });
    const leftArray2 = array2.where((item2) => {
        const key2 = keySelector2(item2);
        return array1.all((item1) => JSON.stringify(keySelector1(item1)) !== JSON.stringify(key2));
    }).select((item2) => resultSelector(undefined, item2));

    return result.concat(leftArray2);
};
Array.prototype.union = (array2: any[], all: boolean = false) => {
    const array1: any[] = this;
    let result = array1.concat(array2);
    if (!all)
        result = result.distinct();

    return result;
};
Array.prototype.intersect = (array2: any[]) => {
    return this.innerJoin(array2, (item1) => item1, (item2) => item2, (item1, item2) => item1)
        .distinct();
};
Array.prototype.except = (array2: any[]) => {
    return this.where((item1) => {
        return array2.any((item2) => JSON.stringify(item2) === JSON.stringify(item1));
    });
};
Array.prototype.pivot = function <T>(this: T[], dimensions, metrics) {
    const dataResult: Array<GroupArray<any, any>> = [];
    for (const item of this) {
        const dimensionKey: { [key: string]: any } = {};
        // tslint:disable-next-line:forin
        for (const key in dimensions) {
            dimensionKey[key] = dimensions[key](item);
        }
        let group = dataResult.first((o) => JSON.stringify(o.Key) === JSON.stringify(dimensionKey));
        if (!group) {
            group = new GroupArray();
            dataResult.push(group);
        }
        group.push(item);
    }

    return dataResult.select((o) => {
        // tslint:disable-next-line:forin
        for (const key in metrics) {
            o.Key[key] = metrics[key](o);
        }
        return o.Key;
    });
};

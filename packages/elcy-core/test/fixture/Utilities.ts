import { expect } from "bun:test";
import { ObjectLike } from "../../src/Common/Type";
import { isValue, isNull } from "../../src/Helper/Util";

export const matchSnapShot = <T>(actual: T, propertyMatchers: any) => {
    match(actual, propertyMatchers, []);
    expect(actual).toMatchSnapshot();
}

const match = <T>(actual: T, matchValue: ObjectLike<T>, path: string[]): boolean => {
    if (isValue(matchValue) || isNull(matchValue)) {
        expect(actual, path.join(".")).toEqual(matchValue as T);
        return true;
    }

    if (matchValue instanceof Set) {
        matchValue = Array.from(matchValue) as T;
        actual = Array.from(actual as Set<unknown>) as T;
    }
    if (matchValue instanceof Map) {
        expect(actual).toBeInstanceOf(Map);
        if (actual instanceof Map) {
            for (const [key, value] of matchValue) {
                const isLeaf = match(actual.get(key), value, [...path, `[${key}]`]);
                if (isLeaf) {
                    actual.set(key, expect.anything());
                }
            }
        }
    }
    for (const prop in matchValue) {
        const isLeaf = match(actual?.[prop], matchValue[prop], [...path, prop]);
        if (isLeaf) {
            actual[prop] = expect.anything();
        }
    }

    return false;
}
import { test, describe, expectTypeOf } from "bun:test";
import { Enumerable, IEnumerable, ValueType } from "../src";
type IsOptional<T> = {} extends T ? true : false;

describe("IEnumerable", () => {
  test("accept array", () => {
    expectTypeOf<Array<unknown>>().toExtend<IEnumerable<unknown>>();
  });
  test("accept Enumerable", async () => {
    expectTypeOf<Enumerable<unknown>>().toExtend<IEnumerable<unknown>>();
  });
});
describe("Enumerable", () => {
  test("should cast", () => {
    const item: Enumerable = Enumerable.from([]) as any;
    expectTypeOf(item.cast<number>()).toExtend<Enumerable<number>>();
  });
  test("should cast oftype", () => {
    const item: Enumerable = Enumerable.from([]) as any;
    expectTypeOf(item.ofType<number>(Number)).toExtend<Enumerable<number>>();
  });
  describe("MIN", () => {
    test("Enumerable<ValueType>", () => {
      const items = Enumerable.from<ValueType>([]);
      const fn = items.min;
      type FnParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<ValueType>>();
      expectTypeOf<FnParameter>().toExtend<
        [selector?: (item: ValueType) => ValueType]
      >();
      expectTypeOf<IsOptional<Pick<FnParameter, 0>>>().toEqualTypeOf<true>();

      expectTypeOf(fn()).toEqualTypeOf<ValueType>();
      expectTypeOf(fn((o: ValueType) => String(o))).toEqualTypeOf<string>();
    });
    test("Enumerable<unknown>", () => {
      const items = Enumerable.from<unknown>([]);
      const fn = items.min;
      type FnParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<unknown>>();
      expectTypeOf<FnParameter>().toExtend<
        [selector: (item: unknown) => ValueType]
      >();
      expectTypeOf<
        IsOptional<Pick<FnParameter, 0>>
      >().not.toEqualTypeOf<true>();
      expectTypeOf(fn((o) => Boolean(o))).toEqualTypeOf<boolean>();
    });
  });
  describe("MAX", () => {
    test("Enumerable<ValueType>", () => {
      const items = Enumerable.from<ValueType>([]);
      const fn = items.max;
      type FnParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<ValueType>>();
      expectTypeOf<FnParameter>().toExtend<
        [selector?: (item: ValueType) => ValueType]
      >();
      expectTypeOf<IsOptional<Pick<FnParameter, 0>>>().toEqualTypeOf<true>();

      expectTypeOf(fn()).toEqualTypeOf<ValueType>();
      expectTypeOf(fn((o: ValueType) => String(o))).toEqualTypeOf<string>();
    });
    test("Enumerable<unknown>", () => {
      const items = Enumerable.from<unknown>([]);
      const fn = items.max;
      type FnParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<unknown>>();
      expectTypeOf<FnParameter>().toExtend<
        [selector: (item: unknown) => ValueType]
      >();
      expectTypeOf<
        IsOptional<Pick<FnParameter, 0>>
      >().not.toEqualTypeOf<true>();
      expectTypeOf(fn((o) => Boolean(o))).toEqualTypeOf<boolean>();
    });
  });
  describe("SUM", () => {
    test("Enumerable<number | bigint>", () => {
      const items = Enumerable.from<number | bigint>([]);
      const fn = items.sum;
      type FnParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<number | bigint>>();
      expectTypeOf<FnParameter>().toExtend<
        [selector?: (item: number | bigint) => number | bigint]
      >();
      expectTypeOf<IsOptional<Pick<FnParameter, 0>>>().toEqualTypeOf<true>();

      expectTypeOf(fn()).toEqualTypeOf<number | bigint>();
      expectTypeOf(
        fn((o: number | bigint) => BigInt(o)),
      ).toEqualTypeOf<bigint>();
    });
    test("Enumerable<unknown>", () => {
      const items = Enumerable.from<unknown>([]);
      const fn = items.sum;
      type MinParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<unknown>>();
      expectTypeOf<MinParameter>().toExtend<
        [selector: (item: unknown) => number | bigint]
      >();
      expectTypeOf<
        IsOptional<Pick<MinParameter, 0>>
      >().not.toEqualTypeOf<true>();
      expectTypeOf(fn((o: unknown) => Number(o))).toEqualTypeOf<number>();
    });
  });
  describe("AVG", () => {
    test("Enumerable<number | bigint>", () => {
      const items = Enumerable.from<number | bigint>([]);
      const fn = items.sum;
      type FnParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<number | bigint>>();
      expectTypeOf<FnParameter>().toExtend<
        [selector?: (item: number | bigint) => number | bigint]
      >();
      expectTypeOf<IsOptional<Pick<FnParameter, 0>>>().toEqualTypeOf<true>();

      expectTypeOf(fn()).toEqualTypeOf<number | bigint>();
      expectTypeOf(
        fn((o: number | bigint) => BigInt(o)),
      ).toEqualTypeOf<bigint>();
    });
    test("Enumerable<unknown>", () => {
      const items = Enumerable.from<unknown>([]);
      const fn = items.sum;
      type MinParameter = Parameters<typeof fn>;
      expectTypeOf(items).toExtend<Enumerable<unknown>>();
      expectTypeOf<MinParameter>().toExtend<
        [selector: (item: unknown) => number | bigint]
      >();
      expectTypeOf<
        IsOptional<Pick<MinParameter, 0>>
      >().not.toEqualTypeOf<true>();
      expectTypeOf(fn((o: unknown) => Number(o))).toEqualTypeOf<number>();
    });
  });
  describe("JOIN", () => {
    test("Enumerable<string>", () => {
      const items = Enumerable.from<string>([]);
      expectTypeOf(items).toExtend<Enumerable<string>>();
      expectTypeOf(items.join).toExtend<Function>();

      expectTypeOf(items.join()).toEqualTypeOf<string>();
    });
    test("Enumerable<unknown>", () => {
      const items = Enumerable.from<unknown>([]);
      expectTypeOf(items).toExtend<Enumerable<unknown>>();
      expectTypeOf(items.join).toExtend<never>();
    });
  });
});

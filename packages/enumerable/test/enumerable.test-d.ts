import { test, describe, expectTypeOf } from "bun:test";
import { Enumerable, IEnumerable } from "../src";

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
});

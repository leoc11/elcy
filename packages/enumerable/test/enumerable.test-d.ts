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

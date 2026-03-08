import { describe, it, expect } from "bun:test";
import { Enumerable } from "../src/Enumerable";
import { GroupByIterator } from "../src/GroupByIterator";
import { GroupedEnumerable } from "../src";

describe("ENUMERABLE", () => {
  const items = Enumerable.from([
    1, 5, 3, 0, 0, 0, 1, 8, 5, 5, 9, 0, 2, 6, 4, 8, 7
  ]);
  const items2 = Enumerable.from([
    [1, 2],
    [3, 4],
  ]);
  const objArray = Enumerable.from([
    { position: 6, value: 6 },
    { position: 3, value: 12 },
    { position: 1, value: 1 },
    { position: 3, value: 1 },
  ]);
  describe("DISTINCT", () => {
    it("should work", () => {
      const distincts = items.distinct();
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(10);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
    });
  });
  describe("EXCEPT", () => {
    it("should work", () => {
      const distincts = items.except([1, 5]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).not.toEqual(expect.arrayContaining([1, 5]));
    });
  });
  describe("FULLJOIN", () => {
    it("should work", () => {
      const distincts = items.fullJoin(
        [1, 5],
        (o, o2) => o % 2 === o2 % 2,
        (o1, o2) => (o1 ? o1 : 0) + (o2 ? o2 : 0),
      );
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        2, 6, 6, 10, 4, 8, 0, 0, 0, 2, 6, 8, 6, 10, 6, 10, 10, 14, 0, 2, 6, 4,
        8, 8, 12,
      ]);
    });
  });
  describe("GROUPJOIN", () => {
    it("should work", () => {
      const distincts = items.groupJoin(
        [1, 5],
        (o, o2) => o % 2 === o2 % 2,
        (o1, o2s) => (o1 ? o1 : 0) + (o2s.reduce((r, o) => r + o, 0)),
      );
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(items.count());
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        7, 11, 9, 0, 0, 0, 7, 8, 11, 11, 15, 0, 2, 6, 4, 8, 13
      ]);
    });
  });
  describe("CROSSJOIN", () => {
    it("should work", () => {
      const distincts = Enumerable.from([1, 2, 3, 4, 5]).crossJoin(
        [1, 5],
        (o1, o2) => o1 + o2,
      );
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([2, 6, 3, 7, 4, 8, 5, 9, 6, 10]);
    });
  });
  describe("GROUPBY", () => {
    it("should work", () => {
      const distincts = items.groupBy((o) => o % 2);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(2);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
    });
    it("should auto when group is iterated", () => {
      const source = Enumerable.range(0, 10);
      let iterateCount = 0;
      let firstGroup: GroupedEnumerable<string, number>;
      const groups = source.groupBy((o) => String(o % 3));
      for (const group of groups) {
        for (const { } of group) {
          iterateCount++;
        }
        firstGroup = group;
        break;
      }

      expect(iterateCount).toBe(4);
      const sourceResult = (source as unknown as { cache: { result: number[] } }).cache.result;
      const groupByIterator: GroupByIterator<number, number> = (firstGroup as any).iterator;
      expect(sourceResult).toBeArrayOfSize(11);
      expect(groupByIterator.isDone).toBe(true);
      expect(groupByIterator.result).toBeArrayOfSize(3);

      const groupCacheResult = (firstGroup as unknown as { cache: { result: number[] } }).cache.result;
      expect(groupByIterator.groupResultMap.get(String(firstGroup.key))).toBe(groupCacheResult);
    });
    it("should group by object", () => {
      const source = Enumerable.range(0, 10);
      const groups = source.groupBy((o) => ({ modulo: o % 3 }));
      let groupCount = 0;
      let groupItemCounts = [];
      let groupList: GroupedEnumerable<{ modulo: number }, number>[] = [];
      for (const group of groups) {
        groupList.push(group);
        let iterateCount = 0;
        for (const { } of group) {
          iterateCount++;
        }
        groupItemCounts.push(iterateCount);
        groupCount++;
      }

      expect(groupCount).toBe(3);
      expect(groupItemCounts).toEqual([4, 4, 3]);
      expect(groupList.map(o => o.key.modulo)).toEqual([0, 1, 2]);
    });
    it("should group by class", () => {
      class Modulo {
        constructor(public readonly modulo: number) { }
        public method() {
          return this.modulo;
        }
      }
      const source = Enumerable.range(0, 10);
      const groups = source.groupBy((o) => new Modulo(o % 3));
      let groupCount = 0;
      let groupItemCounts = [];
      let groupList: GroupedEnumerable<{ modulo: number }, number>[] = [];
      for (const group of groups) {
        groupList.push(group);
        let iterateCount = 0;
        for (const { } of group) {
          iterateCount++;
        }
        groupItemCounts.push(iterateCount);
        groupCount++;
      }

      expect(groupCount).toBe(3);
      expect(groupItemCounts).toEqual([4, 4, 3]);
      expect(groupList.map(o => o.key.modulo)).toEqual([0, 1, 2]);
    });
    it("should group by date", () => {
      const source = Enumerable.range(0, 10);
      const groups = source.groupBy((o) => new Date(o % 3));
      let groupCount = 0;
      let groupItemCounts = [];
      let groupList: GroupedEnumerable<Date, number>[] = [];
      for (const group of groups) {
        groupList.push(group);
        let iterateCount = 0;
        for (const { } of group) {
          iterateCount++;
        }
        groupItemCounts.push(iterateCount);
        groupCount++;
      }

      expect(groupCount).toBe(3);
      expect(groupItemCounts).toEqual([4, 4, 3]);
      expect(groupList.map(o => o.key.getTime())).toEqual([0, 1, 2]);
    });
    it("should group by primitive", () => {
      const source = Enumerable.range(0, 10);
      const groups = source.groupBy((o) => o % 3);
      let groupCount = 0;
      let groupItemCounts = [];
      let groupList: GroupedEnumerable<number, number>[] = [];
      for (const group of groups) {
        groupList.push(group);
        let iterateCount = 0;
        for (const { } of group) {
          iterateCount++;
        }
        groupItemCounts.push(iterateCount);
        groupCount++;
      }

      expect(groupCount).toBe(3);
      expect(groupItemCounts).toEqual([4, 4, 3]);
      expect(groupList.map(o => o.key)).toEqual([0, 1, 2]);
    });
  });
  describe("INNERJOIN", () => {
    it("should work", () => {
      const distincts = items.innerJoin(
        [0, 1],
        (o, o2) => o % 5 === o2 % 2,
        (o1, o2) => o1 + o2,
      );
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([2, 5, 0, 0, 0, 2, 5, 5, 0, 7]);
    });
  });
  describe("INTERSECT", () => {
    it("should work", () => {
      const distincts = items.intersect([2, 11]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(1);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([2]);
    });
  });
  describe("LEFTJOIN", () => {
    it("should work", () => {
      const distincts = items.leftJoin(
        [0, 1],
        (o, o2) => o % 2 === o2 % 2,
        (o1, o2) => (o1 ? o1 : 0) + (o2 ? o2 : 0),
      );
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        2, 6, 4, 0, 0, 0, 2, 8, 6, 6, 10, 0, 2, 6, 4, 8, 8,
      ]);
    });
  });
  describe("ORDER", () => {
    it("should sort by asc", () => {
      const distincts = items.orderBy([(o) => o]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        0, 0, 0, 0, 1, 1, 2, 3, 4, 5, 5, 5, 6, 7, 8, 8, 9,
      ]);
    });
    it("should sort by desc", () => {
      const distincts = items.orderBy([(o) => o, "DESC"]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        9, 8, 8, 7, 6, 5, 5, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0,
      ]);
    });
    it("should sort by position asc, value desc", () => {
      const distincts = objArray.orderBy(
        [(o) => o.position],
        [(o) => o.value, "DESC"],
      );
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        { position: 1, value: 1 },
        { position: 3, value: 12 },
        { position: 3, value: 1 },
        { position: 6, value: 6 },
      ]);
    });
  });
  describe("RIGHTJOIN", () => {
    it("should work", () => {
      const distincts = items.rightJoin(
        [0, 12],
        (o, o2) => o % 2 === o2,
        (o1, o2) => (o1 ? o1 : 0) + (o2 ? o2 : 0),
      );
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([0, 0, 0, 8, 0, 2, 6, 4, 8, 12]);
    });
  });
  describe("MAP", () => {
    it("should work", () => {
      const distincts = items.map((o) => o % 2);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1,
      ]);
    });
  });
  describe("FLATMAP", () => {
    it("should work", () => {
      const distincts = items2.flatMap((o) => o);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([1, 2, 3, 4]);
    });
  });
  describe("SKIP TAKE", () => {
    it("should work", () => {
      const distincts = items.skip(10).take(2);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(2);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([9, 0]);
    });
  });
  describe("SLICE", () => {
    it("should work", () => {
      const distincts = items.slice(10, 2);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(2);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([9, 0]);
    });
  });
  describe("UNION", () => {
    it("should work", () => {
      const distincts = items2.union([[5, 6]]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(3);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });
    it("should only include unique", () => {
      const distincts = items.union([0, 8, 7, 100]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(items.distinct().count() + 1);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual(items.distinct().toArray().concat([100]));
    });
  });
  describe("CONCAT", () => {
    it("should work", () => {
      const distincts = items2.concat([[5, 6]]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(3);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });
    it("should include duplicate", () => {
      const distincts = items.concat([0, 8, 7, 100], [100]);
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }
      const array = distincts.toArray();

      expect(index1).toBe(items.count() + 5);
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual(items.toArray().concat([0, 8, 7, 100], [100]));
    });
  });
  describe("FILTER", () => {
    it("should work", () => {
      const where = items.filter((o) => o % 2 === 0);
      let index1 = 0;
      for (const { } of where) {
        index1++;
      }
      let index2 = 0;
      for (const { } of where) {
        index2++;
      }
      const array = where.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
    });
    it("should apply multiple filter", () => {
      const where = items.filter((o) => o % 2 === 0).filter((o) => o <= 2);
      let index1 = 0;
      for (const { } of where) {
        index1++;
      }
      let index2 = 0;
      for (const { } of where) {
        index2++;
      }
      const array = where.toArray();

      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([0, 0, 0, 0, 2]);
    });
  });
  describe("CAST", () => {
    it("should work", () => {
      const distincts = (items as Enumerable<unknown>).cast<number>();
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }

      expect(distincts).toBe(items);
      expect(index1).toBe(items.count());
      expect(index1).toBe(index2);
    });
  });
  describe("PIVOT", () => {
    it("should work", () => {
      const distincts = items.pivot({
        modulo: o => o % 2
      }, {
        max: o => Enumerable.from(o).max()
      });
      let index1 = 0;
      for (const { } of distincts) {
        index1++;
      }
      let index2 = 0;
      for (const { } of distincts) {
        index2++;
      }

      const array = distincts.toArray();
      expect(index1).toBe(items.groupBy(o => o % 2).count());
      expect(index1).toBe(index2);
      expect(array).toBeInstanceOf(Array);
      expect(array).toHaveLength(index1);
      expect(array).toEqual([{ modulo: 1, max: 9 }, { modulo: 0, max: 8 }]);
    });
  });
});

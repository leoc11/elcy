import "mocha";
import "../src/Extensions/EnumerableExtension";
import "../src/Extensions/DateExtension";
import { should } from "chai";
import { OrderDirection } from "../src/Common/Type";

const items = [1, 5, 3, 0, 0, 0, 1, 8, 5, 5, 9, 0, 2, 6, 4, 8, 7];
const items2 = [[1, 2], [3, 4]];
const objArray = [{ position: 6, value: 6 }, { position: 3, value: 12 }, { position: 1, value: 1 }, { position: 3, value: 1 }];
describe("ENUMERABLE - DISTINCT", () => {
    it("should work", () => {
        const distincts = items.distinct();
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(10);
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
    });
});
describe("ENUMERABLE - EXCEPT", () => {
    it("should work", () => {
        const distincts = items.except([1, 5]);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.not.has.members([1, 5]);
    });
});
describe("ENUMERABLE - FULLJOIN", () => {
    it("should work", () => {
        const distincts = items.fullJoin([1, 5], o => o % 2, o => o % 2, (o1, o2) => (o1 ? o1 : 0) + (o2 ? o2 : 0));
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([2, 6, 6, 10, 4, 8, 0, 0, 0, 2, 6, 8, 6, 10, 6, 10, 10, 14, 0, 2, 6, 4, 8, 8, 12]);
    });
});
describe("ENUMERABLE - GROUPBY", () => {
    it("should work", () => {
        const distincts = items.groupBy(o => o % 2);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(2);
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
    });
});
describe("ENUMERABLE - INNERJOIN", () => {
    it("should work", () => {
        const distincts = items.innerJoin([0, 1], o => o % 5, o => o % 2, (o1, o2) => o1 + o2);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([2, 5, 0, 0, 0, 2, 5, 5, 0, 7]);
    });
});
describe("ENUMERABLE - INTERSECT", () => {
    it("should work", () => {
        const distincts = items.intersect([2, 11]);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(1);
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([2]);
    });
});
describe("ENUMERABLE - LEFTJOIN", () => {
    it("should work", () => {
        const distincts = items.leftJoin([0, 1], o => o % 2, o => o % 2, (o1, o2) => (o1 ? o1 : 0) + (o2 ? o2 : 0));
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([2, 6, 4, 0, 0, 0, 2, 8, 6, 6, 10, 0, 2, 6, 4, 8, 8]);
    });
});
describe("ENUMERABLE - ORDER", () => {
    it("should sort by asc", () => {
        const distincts = items.orderBy([o => o]);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([0, 0, 0, 0, 1, 1, 2, 3, 4, 5, 5, 5, 6, 7, 8, 8, 9]);
    });
    it("should sort by desc", () => {
        const distincts = items.orderBy([o => o, OrderDirection.DESC]);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([9, 8, 8, 7, 6, 5, 5, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0]);
    });
    it("should sort by position asc, value desc", () => {
        const distincts = objArray.orderBy([o => o.position], [o => o.value, OrderDirection.DESC]);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([{ position: 1, value: 1 }, { position: 3, value: 12 }, { position: 3, value: 1 }, { position: 6, value: 6 }]);
    });
});
describe("ENUMERABLE - RIGHTJOIN", () => {
    it("should work", () => {
        const distincts = items.rightJoin([0, 12], o => o % 2, o => o, (o1, o2) => (o1 ? o1 : 0) + (o2 ? o2 : 0));
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([0, 0, 0, 8, 0, 2, 6, 4, 8, 12]);
    });
});
describe("ENUMERABLE - SELECT", () => {
    it("should work", () => {
        const distincts = items.select(o => o % 2);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1]);
    });
});
describe("ENUMERABLE - SELECTMANY", () => {
    it("should work", () => {
        const distincts = items2.selectMany(o => o);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([1, 2, 3, 4]);
    });
});
describe("ENUMERABLE - SKIP TAKE", () => {
    it("should work", () => {
        const distincts = items.skip(10).take(2);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(2);
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([9, 0]);
    });
});
describe("ENUMERABLE - UNION", () => {
    it("should work", () => {
        const distincts = items2.union([[5, 6]]);
        let index1 = 0;
        for (const { } of distincts) { index1++; }
        let index2 = 0;
        for (const { } of distincts) { index2++; }
        const array = distincts.toArray();

        should();
        index1.should.equal(3);
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([[1, 2], [3, 4], [5, 6]]);
    });
});
describe("ENUMERABLE - WHERE", () => {
    it("should work", () => {
        const where = items.where(o => o % 2 === 0);
        let index1 = 0;
        for (const { } of where) { index1++; }
        let index2 = 0;
        for (const { } of where) { index2++; }
        const array = where.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
    });
    it("should apply multiple filter", () => {
        const where = items.where(o => o % 2 === 0).where(o => o <= 2);
        let index1 = 0;
        for (const { } of where) { index1++; }
        let index2 = 0;
        for (const { } of where) { index2++; }
        const array = where.toArray();

        should();
        index1.should.equal(index2);
        array.should.be.a("array");
        array.should.has.lengthOf(index1);
        array.should.deep.equals([0, 0, 0, 0, 2]);
    });
});

import { expect, describe, it } from "bun:test";
import { mockContext } from "../../fixture/mock/MockContext";
import { PostgresqlContext, Table1, Table2 } from "../../fixture";

const db = new PostgresqlContext();
mockContext(db);

describe("DEFERRED QUERY", () => {
    describe("TO ARRAY", async () => {
        it("should work", async () => {
            const deferred = db.table1s.loads((o) => o.table1Manies).deferredToArray();
            // do something here.
            const a = await deferred.execute();

            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBeGreaterThan(0);
            expect(a[0]).toBeInstanceOf(Table1);
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.loads((o) => o.table1Manies).deferredToArray();
            await db.table1s.count();
            const a = deferred.value;
            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBeGreaterThan(0);
            expect(a[0]).toBeInstanceOf(Table1);
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.loads((o) => o.table1Manies).deferredToArray();
            // emulate the resolved value.
            deferred.value = [];
            const a = await deferred.execute();
            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBe(0);
        });
    });
    describe("COUNT", async () => {
        it("should work", async () => {
            const deferred = db.table1s.loads((o) => o.table1Manies).deferredCount();
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.loads((o) => o.table1Manies).deferredCount();
            await db.table1s.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.loads((o) => o.table1Manies).deferredCount();
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("SUM", async () => {
        it("should work", async () => {
            const deferred = db.table1s.deferredSum((o) => o.decimalNumber);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.deferredSum((o) => o.decimalNumber);
            await db.table1s.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.deferredSum((o) => o.decimalNumber);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("MAX", async () => {
        it("should work", async () => {
            const deferred = db.table1s.deferredMax((o) => o.decimalNumber);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.deferredMax((o) => o.decimalNumber);
            await db.table1s.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.deferredMax((o) => o.decimalNumber);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("MIN", async () => {
        it("should work", async () => {
            const deferred = db.table1s.deferredMin((o) => o.decimalNumber);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.deferredMin((o) => o.decimalNumber);
            await db.table1s.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.deferredMin((o) => o.decimalNumber);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("AVG", async () => {
        it("should work", async () => {
            const deferred = db.table1s.deferredAvg((o) => o.decimalNumber);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.deferredAvg((o) => o.decimalNumber);
            await db.table1s.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.deferredAvg((o) => o.decimalNumber);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("EVERY", async () => {
        it("should work", async () => {
            const deferred = db.table1s.deferredEvery((o) => o.decimalNumber < 1000000000);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("boolean");
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.deferredEvery((o) => o.decimalNumber > 100000);
            await db.table1s.count();
            const a = deferred.value;
            expect(typeof a).toBe("boolean");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.deferredEvery((o) => o.decimalNumber > 100000);
            // emulate the resolved value.
            deferred.value = true;
            const a = await deferred.execute();
            expect(a).toBe(true);
        });
    });
    describe("SOME", async () => {
        it("should work", async () => {
            const deferred = db.table1s.deferredSome((o) => o.decimalNumber < 1000000000);
            // do something here.
            const a = await deferred.execute();

            expect(a).toBe(true);
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.deferredSome((o) => o.decimalNumber > 100000);
            await db.table1s.count();
            const a = deferred.value;
            expect(typeof a).toBe("boolean");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.deferredSome((o) => o.decimalNumber < 0);
            // emulate the resolved value.
            deferred.value = true;
            const a = await deferred.execute();
            expect(a).toBe(true);
        });
    });
    describe("FIND", async () => {
        it("should work", async () => {
            const deferred = db.table1s.deferredFind();
            // do something here.
            const a = await deferred.execute();

            expect(a).toBeInstanceOf(Table1);
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.deferredFind();
            await db.table1s.count();
            const a = deferred.value;

            expect(a).toBeInstanceOf(Table1);
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.deferredFind();
            // emulate the resolved value.
            deferred.value = null;
            const a = await deferred.execute();
            expect(a).toBe(null);
        });
    });
    describe("INCLUDES", async () => {
        it("should work", async () => {
            const deferred = db.table1s.map((o) => o.decimalNumber).deferredIncludes(10000);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("boolean");
        });
        it("should be executed in batch", async () => {
            const deferred = db.table1s.map((o) => o.decimalNumber).deferredIncludes(10000);
            await db.table1s.count();
            const a = deferred.value;

            expect(typeof a).toBe("boolean");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.table1s.map((o) => o.decimalNumber).deferredIncludes(-20);
            // emulate the resolved value.
            deferred.value = true;
            const a = await deferred.execute();
            expect(a).toBe(true);
        });
    });
    describe("ADVANCE", async () => {
        it("should wait for result if it being executed", async () => {
            const db2 = new PostgresqlContext();
            mockContext(db2);
            const collection = db.table2s.deferredToArray();
            // remove deferred query from context to emulate it state as waiting for execution to complete
            db2.deferredQueries = db.deferredQueries.splice(0);
            const c = db2.table1s.deferredCount();
            c.execute();
            const a = await collection.execute();

            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBeGreaterThan(0);
            expect(a[0]).toBeInstanceOf(Table2);
            expect(typeof c.value).toBe("number");
        });
        it("should execute several query in batch", async () => {
            const sum = db.table1s.map((o) => o.decimalNumber).deferredSum();
            const any = db.table1s.deferredSome((o) => o.decimalNumber < 1000000000);
            const array = db.table1s.loads((o) => o.table1Manies).deferredToArray();
            // do something here.
            await any.execute();

            expect(typeof sum.value).toBe("number");
            expect(typeof any.value).toBe("boolean");
            expect(array.value).toBeInstanceOf(Array);
            expect(array.value[0]).toBeInstanceOf(Table1);
        });
        it("should not have overlaping parameter issue", async () => {
            let value = 10000;
            const any1 = db.table1s.parameter({ value }).filter((o) => o.decimalNumber < value).deferredToArray();

            value = 10;
            const any2 = db.table1s.parameter({ value }).filter((o) => o.decimalNumber < value).deferredToArray();

            await any2.execute();

            expect(any1.value).toBeInstanceOf(Array);
            expect(any2.value).toBeInstanceOf(Array);
            expect(any1.value).not.toEqual(any2.value);
        });
    });
});

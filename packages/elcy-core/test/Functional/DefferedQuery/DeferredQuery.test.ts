import { expect, describe, it } from "vitest";
import { mockContext } from "../../Mock/MockContext";
import { Collection, Order } from "../../Common/Model";
import { MyDb } from "../../Common/MyDb";

const db = new MyDb();
mockContext(db);

describe("DEFERRED QUERY", () => {
    describe("TO ARRAY", async () => {
        it("should work", async () => {
            const deferred = db.orders.loads((o) => o.OrderDetails).deferredToArray();
            // do something here.
            const a = await deferred.execute();

            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBeGreaterThan(0);
            expect(a[0]).toBeInstanceOf(Order);
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.loads((o) => o.OrderDetails).deferredToArray();
            await db.orders.count();
            const a = deferred.value;
            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBeGreaterThan(0);
            expect(a[0]).toBeInstanceOf(Order);
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.loads((o) => o.OrderDetails).deferredToArray();
            // emulate the resolved value.
            deferred.value = [];
            const a = await deferred.execute();
            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBe(0);
        });
    });
    describe("COUNT", async () => {
        it("should work", async () => {
            const deferred = db.orders.loads((o) => o.OrderDetails).deferredCount();
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.loads((o) => o.OrderDetails).deferredCount();
            await db.orders.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.loads((o) => o.OrderDetails).deferredCount();
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("SUM", async () => {
        it("should work", async () => {
            const deferred = db.orders.deferredSum((o) => o.TotalAmount);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.deferredSum((o) => o.TotalAmount);
            await db.orders.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.deferredSum((o) => o.TotalAmount);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("MAX", async () => {
        it("should work", async () => {
            const deferred = db.orders.deferredMax((o) => o.TotalAmount);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.deferredMax((o) => o.TotalAmount);
            await db.orders.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.deferredMax((o) => o.TotalAmount);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("MIN", async () => {
        it("should work", async () => {
            const deferred = db.orders.deferredMin((o) => o.TotalAmount);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.deferredMin((o) => o.TotalAmount);
            await db.orders.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.deferredMin((o) => o.TotalAmount);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("AVG", async () => {
        it("should work", async () => {
            const deferred = db.orders.deferredAvg((o) => o.TotalAmount);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("number");
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.deferredAvg((o) => o.TotalAmount);
            await db.orders.count();
            const a = deferred.value;
            expect(typeof a).toBe("number");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.deferredAvg((o) => o.TotalAmount);
            // emulate the resolved value.
            deferred.value = Infinity;
            const a = await deferred.execute();
            expect(a).toBe(Infinity);
        });
    });
    describe("EVERY", async () => {
        it("should work", async () => {
            const deferred = db.orders.deferredEvery((o) => o.TotalAmount < 1000000000);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("boolean");
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.deferredEvery((o) => o.TotalAmount > 100000);
            await db.orders.count();
            const a = deferred.value;
            expect(typeof a).toBe("boolean");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.deferredEvery((o) => o.TotalAmount > 100000);
            // emulate the resolved value.
            deferred.value = true;
            const a = await deferred.execute();
            expect(a).toBe(true);
        });
    });
    describe("SOME", async () => {
        it("should work", async () => {
            const deferred = db.orders.deferredSome((o) => o.TotalAmount < 1000000000);
            // do something here.
            const a = await deferred.execute();

            expect(a).toBe(true);
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.deferredSome((o) => o.TotalAmount > 100000);
            await db.orders.count();
            const a = deferred.value;
            expect(typeof a).toBe("boolean");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.deferredSome((o) => o.TotalAmount < 0);
            // emulate the resolved value.
            deferred.value = true;
            const a = await deferred.execute();
            expect(a).toBe(true);
        });
    });
    describe("FIND", async () => {
        it("should work", async () => {
            const deferred = db.orders.deferredFind();
            // do something here.
            const a = await deferred.execute();

            expect(a).toBeInstanceOf(Order);
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.deferredFind();
            await db.orders.count();
            const a = deferred.value;

            expect(a).toBeInstanceOf(Order);
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.deferredFind();
            // emulate the resolved value.
            deferred.value = null;
            const a = await deferred.execute();
            expect(a).to.be.equal(null);
        });
    });
    describe("INCLUDES", async () => {
        it("should work", async () => {
            const deferred = db.orders.map((o) => o.TotalAmount).deferredIncludes(10000);
            // do something here.
            const a = await deferred.execute();

            expect(typeof a).toBe("boolean");
        });
        it("should be executed in batch", async () => {
            const deferred = db.orders.map((o) => o.TotalAmount).deferredIncludes(10000);
            await db.orders.count();
            const a = deferred.value;

            expect(typeof a).toBe("boolean");
        });
        it("re-execution should used resolved value", async () => {
            const deferred = db.orders.map((o) => o.TotalAmount).deferredIncludes(-20);
            // emulate the resolved value.
            deferred.value = true;
            const a = await deferred.execute();
            expect(a).toBe(true);
        });
    });
    describe("ADVANCE", async () => {
        it("should wait for result if it being executed", async () => {
            const db2 = new MyDb();
            mockContext(db2);
            const collection = db.collections.deferredToArray();
            // remove deferred query from context to emulate it state as waiting for execution to complete
            db2.deferredQueries = db.deferredQueries.splice(0);
            const c = db2.orders.deferredCount();
            c.execute();
            const a = await collection.execute();

            expect(a).toBeInstanceOf(Array);
            expect(a.length).toBeGreaterThan(0);
            expect(a[0]).toBeInstanceOf(Collection);
            expect(typeof c.value).toBe("number");
        });
        it("should execute several query in batch", async () => {
            const sum = db.orders.map((o) => o.TotalAmount).deferredSum();
            const any = db.orders.deferredSome((o) => o.TotalAmount < 1000000000);
            const array = db.orders.loads((o) => o.OrderDetails).deferredToArray();
            // do something here.
            await any.execute();

            expect(typeof sum.value).toBe("number");
            expect(typeof any.value).toBe("boolean");
            expect(array.value).toBeInstanceOf(Array);
            expect(array.value[0]).toBeInstanceOf(Order);
        });
        it("should not have overlaping parameter issue", async () => {
            let value = 10000;
            const any1 = db.orders.parameter({ value }).filter((o) => o.TotalAmount < value).deferredToArray();

            value = 10;
            const any2 = db.orders.parameter({ value }).filter((o) => o.TotalAmount < value).deferredToArray();

            await any2.execute();

            expect(any1.value).toBeInstanceOf(Array);
            expect(any2.value).toBeInstanceOf(Array);
            expect(any1.value).not.toEqual(any2.value);
        });
    });
});

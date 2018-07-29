import { MyDb } from "./Common/MyDb";
import { Collection, Order } from "./Common/Model";
import "mocha";
import "../src/Extensions/DateExtension";
import { should, expect } from "chai";

describe("DEFERRED TO ARRAY", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.include(o => o.OrderDetails).defferedToArray();
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.include(o => o.OrderDetails).defferedToArray();
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.include(o => o.OrderDetails).defferedToArray();
        // emulate the resolved value.
        deferred.value = [];
        const a = await deferred.execute();
        should();
        a.should.be.a("array");
        a.should.has.length(0);
    });
});
describe("DEFERRED COUNT", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.include(o => o.OrderDetails).defferedCount();
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.a("number");
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.include(o => o.OrderDetails).defferedCount();
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("number");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.include(o => o.OrderDetails).defferedCount();
        // emulate the resolved value.
        deferred.value = Infinity;
        const a = await deferred.execute();
        should();
        a.should.be.equal(Infinity);
    });
});
describe("DEFERRED SUM", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredSum(o => o.TotalAmount);
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.a("number");
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredSum(o => o.TotalAmount);
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("number");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredSum(o => o.TotalAmount);
        // emulate the resolved value.
        deferred.value = Infinity;
        const a = await deferred.execute();
        should();
        a.should.be.equal(Infinity);
    });
});
describe("DEFERRED MAX", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredMax(o => o.TotalAmount);
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.a("number");
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredMax(o => o.TotalAmount);
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("number");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredMax(o => o.TotalAmount);
        // emulate the resolved value.
        deferred.value = Infinity;
        const a = await deferred.execute();
        should();
        a.should.be.equal(Infinity);
    });
});
describe("DEFERRED MIN", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredMin(o => o.TotalAmount);
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.a("number");
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredMin(o => o.TotalAmount);
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("number");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredMin(o => o.TotalAmount);
        // emulate the resolved value.
        deferred.value = Infinity;
        const a = await deferred.execute();
        should();
        a.should.be.equal(Infinity);
    });
});
describe("DEFERRED AVG", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAvg(o => o.TotalAmount);
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.a("number");
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAvg(o => o.TotalAmount);
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("number");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAvg(o => o.TotalAmount);
        // emulate the resolved value.
        deferred.value = Infinity;
        const a = await deferred.execute();
        should();
        a.should.be.equal(Infinity);
    });
});
describe("DEFERRED ALL", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAll(o => o.TotalAmount < 1000000000);
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.equal(true);
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAll(o => o.TotalAmount > 100000);
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("boolean");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAll(o => o.TotalAmount > 100000);
        // emulate the resolved value.
        deferred.value = true;
        const a = await deferred.execute();
        should();
        a.should.be.equal(true);
    });
});
describe("DEFERRED ANY", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAny(o => o.TotalAmount < 1000000000);
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.equal(true);
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAny(o => o.TotalAmount > 100000);
        await db.orders.count();
        const a = deferred.value;
        should();
        a.should.be.a("boolean");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredAny(o => o.TotalAmount < 0);
        // emulate the resolved value.
        deferred.value = true;
        const a = await deferred.execute();
        should();
        a.should.be.equal(true);
    });
});
describe("DEFERRED FIRST", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredFirst();
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.an.instanceof(Order);
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredFirst();
        await db.orders.count();
        const a = deferred.value;

        should();
        a.should.be.an.instanceof(Order);
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.deferredFirst();
        // emulate the resolved value.
        deferred.value = null;
        const a = await deferred.execute();
        expect(a).to.be.equal(null);
    });
});
describe("DEFERRED CONTAINS", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const deferred = db.orders.select(o => o.TotalAmount).defferedContains(10000);
        // do something here.
        const a = await deferred.execute();

        should();
        a.should.be.a("boolean");
    });
    it("should be executed in batch", async () => {
        const db = new MyDb();
        const deferred = db.orders.select(o => o.TotalAmount).defferedContains(10000);
        await db.orders.count();
        const a = deferred.value;

        should();
        a.should.be.an("boolean");
    });
    it("re-execution should used resolved value", async () => {
        const db = new MyDb();
        const deferred = db.orders.select(o => o.TotalAmount).defferedContains(-20);
        // emulate the resolved value.
        deferred.value = true;
        const a = await deferred.execute();
        should();
        a.should.be.equal(true);
    });
});
describe("ADVANCE", async () => {
    it("should wait for result if it being executed", async () => {
        const db = new MyDb();
        const db2 = new MyDb();
        const collection = db.collections.include(o => o.Products).defferedToArray();
        // remove deferred query from context to emulate it state as waiting for execution to complete
        db2.deferredQueries = db.deferredQueries.splice(0);
        const c = db2.orders.defferedCount();
        c.execute();
        const a = await collection.execute();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Collection);
        c.value.should.be.an("number");
    });
    it("should execute several query in batch", async () => {
        const db = new MyDb();
        const sum = db.orders.select(o => o.TotalAmount).deferredSum();
        const any = db.orders.deferredAny(o => o.TotalAmount < 1000000000);
        const array = db.orders.include(o => o.OrderDetails).defferedToArray();
        // do something here.
        await any.execute();

        should();
        sum.value.should.be.a("number");
        any.value.should.be.a("boolean");
        array.value.should.be.an("array");
        array.value[0].should.be.an.instanceof(Order);
    });
    it("should not have overlaping parameter issue", async () => {
        const db = new MyDb();

        let value = 10000;
        const any1 = db.orders.parameter({ value }).where(o => o.TotalAmount < value).defferedToArray();

        value = 10;
        const any2 = db.orders.parameter({ value }).where(o => o.TotalAmount < value).defferedToArray();

        await any2.execute();

        should();
        any1.value.should.be.an("array");
        any2.value.should.be.an("array");
        any1.value.length.should.be.greaterThan(any2.value.length);
    });
});

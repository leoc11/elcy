import * as chai from "chai";
import { expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { DefaultResultCacheManager } from "../../../src/Cache/DefaultResultCacheManager";
import { TimeSpan } from "../../../src/Common/TimeSpan";
import { mockContext } from "../../../src/Mock/MockContext";
import { IQueryResult } from "../../../src/Query/IQueryResult";
import { MyDb } from "../../Common/MyDb";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
db.resultCacheManagerFactory = () => new DefaultResultCacheManager();
afterEach(() => {
    db.clear();
    sinon.restore();
});

function sleep(t) {
    return new Promise((r) => {
        setTimeout(function () {
            r();
        }, t);
    });
}
describe("RESULT CACHE", () => {
    describe("Functionality", async () => {
        it("should cached result", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((od) => od.TotalAmount < 10000).sum((od) => od.TotalAmount)
            }));
            const deferredQuery = groupBy.deferredToArray();
            await deferredQuery.execute();
            const resultCache = await db.resultCacheManager.get(deferredQuery.hashCode().toString());
            chai.expect(resultCache).not.equal(null);
        });
        it("should used cached result for same query", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((od) => od.TotalAmount < 10000).sum((od) => od.TotalAmount)
            }));
            const spy = sinon.spy(db, "executeQueries");
            await groupBy.toArray();
            chai.should();
            spy.should.not.be.called;
        });
        it("should used cached result with expiration", async () => {
            await db.resultCacheManager.clear();
            const groupBy = db.orders.take(10).option({
                resultCache: {
                    expiredTime: new Date().addMilliseconds(200)
                }
            });
            const spy = sinon.spy(db, "executeQueries");
            await groupBy.toArray();
            await groupBy.toArray();
            await sleep(200);
            await groupBy.toArray();
            chai.should();
            spy.should.be.callCount(2);
        });
        it("should used cached result with sliding expiration", async () => {
            await db.resultCacheManager.clear();
            const groupBy = db.orders.take(10).option({
                resultCache: {
                    slidingExpiration: new TimeSpan(50)
                }
            });
            const spy = sinon.spy(db, "executeQueries");
            await groupBy.toArray();
            await sleep(30);
            await groupBy.toArray();
            await sleep(30);
            await groupBy.toArray();
            await sleep(60);
            await groupBy.toArray();
            chai.should();
            spy.should.be.callCount(2);
        });
        it("should invalidate cached when record updated", async () => {
            await db.resultCacheManager.clear();
            const query = db.orders.take(10).option({
                resultCache: {
                    invalidateOnUpdate: true
                }
            });
            const spy = sinon.spy(db, "executeQueries");
            await query.toArray();
            await query.toArray();
            await query.toArray();
            await db.orders.where((o) => o.TotalAmount > 10).update({
                TotalAmount: 10
            });
            await query.toArray();
            chai.should();
            spy.should.be.callCount(3);
        });
    });
    describe("DefaultResultCacheManager", () => {
        const cacheManager = new DefaultResultCacheManager();
        it("Basic: get set remove", async () => {
            const qr: IQueryResult[] = [];
            await cacheManager.set("test", qr);
            const cqr = await cacheManager.get("test");
            expect(qr).to.equal(cqr);

            const qr2: IQueryResult[] = [];
            await cacheManager.set("test2", qr2);
            let cqrs = await cacheManager.gets(["test", "test2"]);

            expect(cqrs).to.be.an("array");
            expect(cqrs).has.lengthOf(2);
            expect(cqrs).to.deep.equal([qr, qr2]);

            await cacheManager.remove(["test2"]);
            const cqr2 = await cacheManager.get("test2");
            expect(cqr2).to.be.null;

            await cacheManager.clear();
            cqrs = await cacheManager.gets(["test"]);
            expect(cqrs).to.be.an("array");
            expect(cqrs[0]).to.be.null;
        });
        it("get set", async () => {
            const qr: IQueryResult[] = [];
            await cacheManager.set("test", qr);
            const cqr = await cacheManager.get("test");

            expect(qr).to.equal(cqr);
        });
        it("expiration", async () => {
            const qr: IQueryResult[] = [];
            await cacheManager.set("test", qr, {
                expiredTime: new Date().addMilliseconds(100)
            });
            const cqr = await cacheManager.get("test");
            expect(qr).to.equal(cqr);
            await sleep(100);
            const qr2 = await cacheManager.get("test");
            expect(qr2).to.be.null;
        });
        it("sliding expiration", async () => {
            const qr: IQueryResult[] = [];
            await cacheManager.clear();
            await cacheManager.set("test", qr, {
                slidingExpiration: new TimeSpan(50)
            });
            let cqr = await cacheManager.get("test");
            expect(cqr).to.equal(qr);
            await sleep(30);
            cqr = await cacheManager.get("test");
            expect(cqr).to.equal(qr);
            await sleep(60);
            cqr = await cacheManager.get("test");
            expect(cqr).to.be.null;
        });
        it("tag invalidation", async () => {
            const qr: IQueryResult[] = [];
            await cacheManager.clear();
            await cacheManager.set("test", qr, {
                tags: ["tag1"]
            });
            let cqr = await cacheManager.get("test");
            expect(cqr).to.equal(qr);
            await cacheManager.removeTag(["tag2"]);
            cqr = await cacheManager.get("test");
            expect(cqr).to.equal(qr);
            await cacheManager.removeTag(["tag1"]);
            cqr = await cacheManager.get("test");
            expect(cqr).to.be.null;
        });
        it("tag invalidation", async () => {
            const qr: IQueryResult[] = [];
            await cacheManager.clear();
            await cacheManager.set("test", qr, {
                tags: ["tag1"]
            });
            let cqr = await cacheManager.get("test");
            expect(cqr).to.equal(qr);
            await cacheManager.removeTag(["tag2"]);
            cqr = await cacheManager.get("test");
            expect(cqr).to.equal(qr);
            await cacheManager.removeTag(["tag1"]);
            cqr = await cacheManager.get("test");
            expect(cqr).to.be.null;
        });
    });
});

import * as chai from "chai";
import { expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { DefaultResultCacheManager } from "../../../src/Cache/DefaultResultCacheManager";
import { mockContext } from "../../../src/Mock/MockContext";
import { IQueryResult } from "../../../src/Query/IQueryResult";
import { MyDb } from "../../Common/MyDb";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
db.resultCacheManagerFactory = () => new DefaultResultCacheManager();
afterEach(() => {
    db.clear();
});

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
    });
    describe("DefaultResultCacheManager", () => {
        it("Basic: get set remove", async () => {
            const qr: IQueryResult[] = [];
            await db.resultCacheManager.set("test", qr);
            const cqr = await db.resultCacheManager.get("test");
            expect(qr).to.equal(cqr);

            const qr2: IQueryResult[] = [];
            await db.resultCacheManager.set("test2", qr2);
            let cqrs = await db.resultCacheManager.gets(["test", "test2"]);

            expect(cqrs).to.be.an("array");
            expect(cqrs).has.lengthOf(2);
            expect(cqrs).to.deep.equal([qr, qr2]);

            await db.resultCacheManager.remove(["test2"].where((o) => true));
            const cqr2 = await db.resultCacheManager.get("test2");
            expect(cqr2).to.be.undefined;

            await db.resultCacheManager.clear();
            cqrs = await db.resultCacheManager.gets(["test"]);
            expect(cqrs).to.be.an("array");
            expect(cqrs[0]).to.has.lengthOf(0);
        });
        it("get set", async () => {
            const qr: IQueryResult[] = [];
            await db.resultCacheManager.set("test", qr);
            const cqr = await db.resultCacheManager.get("test");

            expect(qr).to.equal(cqr);
        });
    });
});

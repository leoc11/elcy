import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import { mockContext } from "../../../src/Mock/MockContext";
import { MyDb } from "../../Common/MyDb";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
afterEach(() => {
    db.clear();
});

describe("QUERY CACHE", () => {
    describe("Functionality", async () => {
        it("should cached query", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((od) => od.TotalAmount < 10000).sum((od) => od.TotalAmount)
            }));
            groupBy.toString();
            const queryCache = db.queryCacheManager.get(groupBy.hashCode());
            chai.expect(queryCache).not.equal(null);
        });
        it("should use same query cache with different take skip", async () => {
            // build string with it's query cache
            db.orders.take(10).skip(4).toString();
            const take = db.orders.take(1).skip(2);
            const cache = db.queryCacheManager.get(take.hashCode());

            chai.expect(cache).not.null;
            chai.expect(cache).not.undefined;
        });
        it("should use same query cache for union", async () => {
            // build string with it's query cache
            db.orders.union(db.orders, false).toString();
            const union = db.orders.union(db.orders, true);
            const cache = db.queryCacheManager.get(union.hashCode());

            chai.expect(cache).not.null;
            chai.expect(cache).not.undefined;
        });
        it("should used cached query for same query", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((od) => od.TotalAmount < 10000).sum((od) => od.TotalAmount)
            }));
            const spy = sinon.spy(groupBy, "buildQuery");
            groupBy.toString();
            chai.should();
            spy.should.not.be.called;
        });
        it("should cache based on Function type parameter", async () => {
            let fn = (o: number) => o + 1;
            const where1 = db.orders.parameter({ fn })
                .select((o) => fn(o.TotalAmount));
            where1.toString();

            fn = (o: number) => o - 1;
            const where2 = db.orders.parameter({ fn })
                .select((o) => fn(o.TotalAmount));
            where2.toString();

            fn = (o: number) => o + 1;
            const where1copy = db.orders.parameter({ fn })
                .select((o) => fn(o.TotalAmount));
            const cache1 = db.queryCacheManager.get(where1copy.hashCode());

            fn = (o: number) => o - 1;
            const where2copy = db.orders.parameter({ fn })
                .select((o) => fn(o.TotalAmount));
            const cache2 = db.queryCacheManager.get(where2copy.hashCode());

            chai.expect(cache1).to.not.be.undefined;
            chai.expect(cache2).to.not.be.undefined;
            chai.expect(cache1).to.not.equal(cache2);
        });
    });
    describe("DefaultQueryCacheManager", async function () {
        it("get set", function () {
            db.queryCacheManager.set(1, {});
            const a = db.queryCacheManager.get(1);
            chai.expect(a).to.not.be.undefined;
        });
        it("clear", async () => {
            db.queryCacheManager.set(1, {});
            db.queryCacheManager.clear();
            const a = db.queryCacheManager.get(1);
            chai.expect(a).to.be.undefined;
        });
    });
});

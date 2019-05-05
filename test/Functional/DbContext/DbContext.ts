import { MyDb } from "../../Common/MyDb";
import { Order } from "../../Common/Model";
import { EntityState } from "../../../src/Data/EntityState";
import { Uuid } from "../../../src/Data/Uuid";
import { mockContext } from "../../../src/Mock/MockContext";
import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import * as sinon from "sinon";
import * as chai from "chai";
import * as sinonChai from "sinon-chai";
import { DefaultResultCacheManager } from "../../../src/Cache/DefaultResultCacheManager";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
afterEach(() => {
    db.clear();
});
describe("DBCONTEXT", () => {
    describe("ATTACH", () => {
        it("should attach entity", () => {
            const entry = db.attach(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Unchanged);
        });
        it("should attach and mark added", () => {
            const entry = db.add(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Added);
        });
        it("should attach and mark update", () => {
            const entry = db.update(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Modified);
        });
        it("should mark delete", () => {
            const entry = db.delete(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Deleted);
        });
    });
    describe("CHANGES DETECTION", () => {
        it("should detect property changes and reset", () => {

        });
        it("should not detect property changes for readonly property", () => {

        });
        it("should detect relation changes", () => {

        });
    });
    describe("ENTITY ENTRY", () => {
        it("should reload all properties", () => { });
        it("should load to-one relation", () => { });
        it("should load to-many relation", () => { });
        it("should load multiple relations", () => { });
    });
    describe("QUERY CACHE", () => {
        db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
        it("should cached query", () => {
            const groupBy = db.orderDetails.take(100).where(o => o.GrossSales > 10000).select(o => o.Order).groupBy(o => o.OrderDate.getFullYear()).select(o => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where(o => o.TotalAmount < 10000).sum(o => o.TotalAmount)
            }));
            groupBy.toString();
            const queryCache = db.queryCacheManager.get(groupBy.hashCode());
            chai.expect(queryCache).not.equal(null);
        });
        it("should use same query cache for diff take skip value", async () => {
            // build string with it's query cache
            db.orders.take(10).skip(4).toString();
            const take = db.orders.take(1).skip(2);
            const cache = db.queryCacheManager.get(take.hashCode());

            chai.expect(cache).not.null;
            chai.expect(cache).not.undefined;
        });
        it("should used cached query for same query", () => {
            const groupBy = db.orderDetails.take(100).where(o => o.GrossSales > 10000).select(o => o.Order).groupBy(o => o.OrderDate.getFullYear()).select(o => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where(o => o.TotalAmount < 10000).sum(o => o.TotalAmount)
            }));
            const spy = sinon.spy(groupBy, "buildQuery");
            groupBy.toString();
            chai.should();
            spy.should.not.be.called;
        });
    });
    describe("RESULT CACHE", async () => {
        db.resultCacheManagerFactory = () => new DefaultResultCacheManager();
        it("should cached result", async () => {
            const groupBy = db.orderDetails.take(100).where(o => o.GrossSales > 10000).select(o => o.Order).groupBy(o => o.OrderDate.getFullYear()).select(o => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where(o => o.TotalAmount < 10000).sum(o => o.TotalAmount)
            }));
            const deferredQuery = groupBy.deferredToArray();
            await deferredQuery.execute();
            const resultCache = await db.resultCacheManager.get(deferredQuery.hashCode().toString());
            chai.expect(resultCache).not.equal(null);
        });
        it("should used cached result for same query", async () => {
            const groupBy = db.orderDetails.take(100).where(o => o.GrossSales > 10000).select(o => o.Order).groupBy(o => o.OrderDate.getFullYear()).select(o => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where(o => o.TotalAmount < 10000).sum(o => o.TotalAmount)
            }));
            const spy = sinon.spy(db, "executeQueries");
            await groupBy.toArray();
            chai.should();
            spy.should.not.be.called;
        });
    });
});

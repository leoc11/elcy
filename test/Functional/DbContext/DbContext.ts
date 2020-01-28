import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import { DefaultResultCacheManager } from "../../../src/Cache/DefaultResultCacheManager";
import { EntityState } from "../../../src/Data/EntityState";
import { RelationState } from "../../../src/Data/RelationState";
import { Uuid } from "../../../src/Data/Uuid";
import { mockContext } from "../../../src/Mock/MockContext";
import { Order, OrderDetail, Product } from "../../Common/Model";
import { MyDb } from "../../Common/MyDb";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
afterEach(() => {
    db.clear();
});
describe("DBCONTEXT", () => {
    describe("ENTITY ENTRY", async () => {
        it("should attach entity", () => {
            const entry = db.attach(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Unchanged);
        });
        it("should attach and mark entity added", () => {
            const entry = db.add(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Added);
        });
        it("should attach and mark entity updated", () => {
            const entry = db.update(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Modified);
        });
        it("should mark entity deleted", () => {
            const entry = db.delete(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Deleted);
        });
        it("should detach entity", () => {
            const entity = db.orders.new(Uuid.new());
            const entry = db.detach(entity);
            chai.expect(entry.state).equal(EntityState.Detached);
        });
    });
    describe("ENTITY CHANGES DETECTION", async () => {
        it("should detect property changes and reset", () => {
            const entity = new Order({ OrderDate: null, OrderId: Uuid.new() });
            const entry = db.attach(entity);
            chai.expect(entry.state).equal(EntityState.Unchanged);

            entity.OrderDate = new Date();
            chai.expect(entry.state).equal(EntityState.Modified);
            chai.expect(entry.getModifiedProperties()).to.contains("OrderDate");
            chai.expect(entry.getOriginalValue("OrderDate")).to.equal(null);

            entry.resetChanges();
            chai.expect(entry.state).equal(EntityState.Unchanged);
            chai.expect(entity.OrderDate).equal(null);
            chai.expect(entry.getModifiedProperties()).to.be.empty;
        });
        it("should not detect property changes for readonly property", () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            const entry = db.attach(entity);
            chai.expect(entry.state).equal(EntityState.Unchanged);

            entity.isDeleted = true;
            chai.expect(entry.state).equal(EntityState.Unchanged);
        });
        it("should detect relation changes", () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            db.attach(entity);
            entity.Order = new Order({ OrderId: Uuid.new() });

            const relationEntry = db.relationEntry(entity, "Order", entity.Order);
            chai.expect(relationEntry.state).equal(RelationState.Added);
        });
    });
    describe("RELATION ENTRY", async () => {
        it("should attach relation", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            const relEntry = db.relationAttach(order, "OrderDetails", orderDetail);
            chai.expect(relEntry.state).equal(RelationState.Unchanged);
        });
        it("should attach and mark relation added", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            const relEntry = db.relationAdd(order, "OrderDetails", orderDetail);
            chai.expect(relEntry.state).equal(RelationState.Added);
        });
        it("should mark relation deleted", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            const relEntry = db.relationDelete(order, "OrderDetails", orderDetail);
            chai.expect(relEntry.state).equal(RelationState.Deleted);
        });
        it("should detach relation", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            db.relationAdd(order, "OrderDetails", orderDetail);
            const relEntry = db.relationDetach(order, "OrderDetails", orderDetail);
            chai.expect(relEntry.state).equal(RelationState.Detached);
        });
    });
    describe("ENTITY ENTRY", async () => {
        it("should reload all properties", async () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            const entry = db.attach(entity);
            await entry.reload();
            chai.expect(entity).to.has.property("name").that.not.null;
            chai.expect(entity).to.has.property("quantity").that.not.null;
        });
        it("should load to-one relation", async () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            const entry = db.attach(entity);
            await entry.loadRelation((o) => o.Order);
            chai.expect(entity).to.has.property("Order").that.is.an.instanceOf(Order);
        });
        it("should load to-many relation", async () => {
            const entity = new Order({ OrderId: Uuid.new() });
            const entry = db.attach(entity);
            await entry.loadRelation((o) => o.OrderDetails);
            chai.expect(entity).to.has.property("OrderDetails").that.is.an("array").and.not.empty;
            for (const o of entity.OrderDetails) {
                o.should.be.an.instanceof(OrderDetail);
            }
        });
        it("should load multiple relations", async () => {
            const entity = new Order({ OrderId: Uuid.new() });
            const entry = db.attach(entity);
            await entry.loadRelation((o) => o.OrderDetails.include((od) => od.Product));
            chai.expect(entity).to.has.property("OrderDetails").that.is.an("array").and.not.empty;
            for (const o of entity.OrderDetails) {
                chai.expect(o).to.be.an.instanceof(OrderDetail);
                chai.expect(o).to.has.property("Product").that.is.an.instanceOf(Product);
            }
        });
    });
    describe("QUERY CACHE", async () => {
        before(async () => {
            db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
        });
        after(async () => {
            db.queryCacheManagerFactory = null;
        });
        it("should cached query", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
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
        it("should used cached query for same query", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const spy = sinon.spy(groupBy, "buildQuery");
            groupBy.toString();
            chai.should();
            spy.should.not.be.called;
        });
    });
    describe("RESULT CACHE", async () => {
        before(async () => {
            db.resultCacheManagerFactory = () => new DefaultResultCacheManager();
        });
        after(async () => {
            db.resultCacheManagerFactory = null;
        });
        it("should cached result", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
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
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const spy = sinon.spy(db, "executeQueries");
            await groupBy.toArray();
            chai.should();
            spy.should.not.be.called;
        });
    });
});

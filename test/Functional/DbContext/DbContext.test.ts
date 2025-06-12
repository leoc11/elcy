import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { DefaultQueryCacheManager } from "../../../src/Cache/DefaultQueryCacheManager";
import { DefaultResultCacheManager } from "../../../src/Cache/DefaultResultCacheManager";
import { EntityState } from "../../../src/Data/EntityState";
import { Uuid } from "../../../src/Data/Uuid";
import { mockContext } from "../../Mock/MockContext";
import { Order, OrderDetail, Product } from "../../Common/Model";
import { MyDb } from "../../Common/MyDb";
import { RelationState } from "../../../src/Data/RelationState";

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
            expect(entry.state).toBe(EntityState.Unchanged);
        });
        it("should attach and mark entity added", () => {
            const entry = db.add(new Order({
                OrderId: Uuid.new()
            }));
            expect(entry.state).toBe(EntityState.Added);
        });
        it("should attach and mark entity updated", () => {
            const entry = db.update(new Order({
                OrderId: Uuid.new()
            }));
            expect(entry.state).toBe(EntityState.Modified);
        });
        it("should mark entity deleted", () => {
            const entry = db.delete(new Order({
                OrderId: Uuid.new()
            }));
            expect(entry.state).toBe(EntityState.Deleted);
        });
        it("should detach entity", () => {
            const entity = db.orders.new(Uuid.new());
            const entry = db.detach(entity);
            expect(entry.state).toBe(EntityState.Detached);
        });
    });
    describe("ENTITY CHANGES DETECTION", async () => {
        it("should detect property changes and reset", () => {
            const entity = new Order({ OrderDate: null, OrderId: Uuid.new() });
            const entry = db.attach(entity);
            expect(entry.state).toBe(EntityState.Unchanged);

            entity.OrderDate = new Date();
            expect(entry.state).toBe(EntityState.Modified);
            expect(entry.getModifiedProperties()).to.contains("OrderDate");
            expect(entry.getOriginalValue("OrderDate")).to.equal(null);

            entry.resetChanges();
            expect(entry.state).toBe(EntityState.Unchanged);
            expect(entity.OrderDate).toBe(null);
            expect(entry.getModifiedProperties()).to.be.empty;
        });
        it("should not detect property changes for readonly property", () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            const entry = db.attach(entity);
            expect(entry.state).toBe(EntityState.Unchanged);

            entity.isDeleted = true;
            expect(entry.state).toBe(EntityState.Unchanged);
        });
        it("should detect relation changes", () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            db.attach(entity);
            entity.Order = new Order({ OrderId: Uuid.new() });

            const relationEntry = db.relationEntry(entity, "Order", entity.Order);
            expect(relationEntry.state).toBe(RelationState.Added);
        });
    });
    describe("RELATION ENTRY", async () => {
        it("should attach relation", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            const relEntry = db.relationAttach(order, "OrderDetails", orderDetail);
            expect(relEntry.state).toBe(RelationState.Unchanged);
        });
        it("should attach and mark relation added", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            const relEntry = db.relationAdd(order, "OrderDetails", orderDetail);
            expect(relEntry.state).toBe(RelationState.Added);
        });
        it("should mark relation deleted", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            const relEntry = db.relationDelete(order, "OrderDetails", orderDetail);
            expect(relEntry.state).toBe(RelationState.Deleted);
        });
        it("should detach relation", () => {
            const order = new Order({ OrderId: Uuid.new() });
            const orderDetail = new OrderDetail({ OrderDetailId: Uuid.new() });
            db.relationAdd(order, "OrderDetails", orderDetail);
            const relEntry = db.relationDetach(order, "OrderDetails", orderDetail);
            expect(relEntry.state).toBe(RelationState.Detached);
        });
    });
    describe("ENTITY ENTRY", async () => {
        it("should reload all properties", async () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            const entry = db.attach(entity);
            await entry.reload();
            expect(entity).to.has.property("name").that.not.null;
            expect(entity).to.has.property("quantity").that.not.null;
        });
        it("should load to-one relation", async () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            const entry = db.attach(entity);
            await entry.loadRelation((o) => o.Order);
            expect(entity).to.has.property("Order").that.is.an.instanceOf(Order);
        });
        it("should load to-many relation", async () => {
            const entity = new Order({ OrderId: Uuid.new() });
            const entry = db.attach(entity);
            await entry.loadRelation((o) => o.OrderDetails);
            expect(entity).to.has.property("OrderDetails").that.is.an("array").and.not.empty;
            for (const o of entity.OrderDetails) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("should load multiple relations", async () => {
            const entity = new Order({ OrderId: Uuid.new() });
            const entry = db.attach(entity);
            await entry.loadRelation((o) => o.OrderDetails.include((od) => od.Product));
            expect(entity).to.has.property("OrderDetails").that.is.an("array").and.not.empty;
            for (const o of entity.OrderDetails) {
                expect(o).toBeInstanceOf(OrderDetail);
                expect(o).to.has.property("Product").that.is.an.instanceOf(Product);

            }
        });
    });
    describe("QUERY CACHE", async () => {
        beforeAll(async () => {
            db.queryCacheManagerFactory = () => new DefaultQueryCacheManager();
        });
        afterAll(async () => {
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
            expect(queryCache).not.equal(null);
        });
        it("should use same query cache for diff take skip value", async () => {
            // build string with it's query cache
            db.orders.take(10).skip(4).toString();
            const take = db.orders.take(1).skip(2);
            const cache = db.queryCacheManager.get(take.hashCode());

            expect(cache).not.null;
            expect(cache).not.undefined;
        });
        it("should used cached query for same query", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const spy = vi.spyOn(groupBy, "buildQuery");
            groupBy.toString();
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe("RESULT CACHE", async () => {
        beforeAll(async () => {
            db.resultCacheManagerFactory = () => new DefaultResultCacheManager();
        });
        afterAll(async () => {
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
            expect(resultCache).not.equal(null);
        });
        it("should used cached result for same query", async () => {
            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const spy = vi.spyOn(db, "executeQueries");
            await groupBy.toArray();
            expect(spy).not.toHaveBeenCalled();
        });
    });
});

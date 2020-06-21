import * as chai from "chai";
import { expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { IsolationLevel } from "../../../src/Common/StringType";
import { FlatObjectLike } from "../../../src/Common/Type";
import { Uuid } from "../../../src/Common/Uuid";
import { EntityState } from "../../../src/Data/EntityState";
import { RelationState } from "../../../src/Data/RelationState";
import { mockContext } from "../../../src/Mock/MockContext";
import { Order, OrderDetail, OrderDetailProperty, Product } from "../../Common/Model";
import { MyDb } from "../../Common/MyDb";

chai.use(sinonChai);

const db = new MyDb();
mockContext(db);
beforeEach(async () => {
    db.connection = await db.getConnection();
});
afterEach(() => {
    db.clear();
    sinon.restore();
    db.closeConnection();
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
        it("should attach and mark entity updated 1", () => {
            const entry = db.update(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Modified);
        });
        it("should attach and mark entity updated 2", () => {
            const oriVal: FlatObjectLike<Order> = {
                TotalAmount: 10000,
                OrderDate: Date.utcTimestamp()
            };
            const entry = db.update(new Order({
                OrderId: Uuid.new(),
                TotalAmount: 20000,
                OrderDate: Date.timestamp()
            }), oriVal);
            chai.expect(entry.state).equal(EntityState.Modified);
            for (const prop in oriVal) {
                chai.expect(entry.getOriginalValue(prop as keyof Order)).to.equal(oriVal[prop]);
            }
        });
        it("should mark entity deleted", () => {
            const entry = db.delete(new Order({
                OrderId: Uuid.new()
            }));
            chai.expect(entry.state).equal(EntityState.Deleted);
        });
        it("should attach entity and relations", () => {
            const od = new OrderDetail({
                OrderId: Uuid.new(),
                OrderDetailId: Uuid.new(),
                ProductId: Uuid.new()
            });
            od.Product = new Product({
                ProductId: od.ProductId
            });
            od.OrderDetailProperties = [
                new OrderDetailProperty({
                    OrderDetailPropertyId: Uuid.new(),
                    OrderDetailId: od.OrderDetailId
                }),
                new OrderDetailProperty({
                    OrderDetailPropertyId: Uuid.new(),
                    OrderDetailId: od.OrderDetailId
                })
            ];
            const entry = db.attach(od, true);
            chai.expect(db.products.local.count()).to.equal(1);
            chai.expect(db.orderDetailProperties.local.count()).to.equal(2);

            chai.expect(entry.state).equal(EntityState.Unchanged);
            const pentry = db.entry(od.Product);
            chai.expect(pentry.state).equal(EntityState.Unchanged);

            const odpentry1 = db.entry(od.OrderDetailProperties[0]);
            chai.expect(odpentry1.state).equal(EntityState.Unchanged);
            const odpentry2 = db.entry(od.OrderDetailProperties[1]);
            chai.expect(odpentry2.state).equal(EntityState.Unchanged);

            const odpre = entry.getRelation("Product", pentry);
            chai.expect(odpre.state).to.equal(RelationState.Unchanged);

            const ododpre1 = entry.getRelation("OrderDetailProperties", odpentry1);
            chai.expect(ododpre1.state).to.equal(RelationState.Unchanged);

            const ododpre2 = entry.getRelation("OrderDetailProperties", odpentry2);
            chai.expect(ododpre2.state).to.equal(RelationState.Unchanged);
        });
        it("should detach entity", () => {
            const entity = db.orders.new(Uuid.new());
            const entry = db.detach(entity);
            chai.expect(entry.state).equal(EntityState.Detached);
        });
        it("should reload all properties", async () => {
            const entity = new OrderDetail({ OrderDetailId: Uuid.new(), isDeleted: false });
            const entry = db.attach(entity);
            chai.expect(entry.isCompletelyLoaded).to.equal(false);
            await entry.reload();
            chai.expect(entry.isCompletelyLoaded).to.equal(true);
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
                chai.expect(o).to.be.an.instanceof(OrderDetail);
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
    describe("TRANSACTION", async () => {
        it("should worked", async () => {
            const spy = sinon.spy(db, "closeConnection");
            const spy1 = sinon.spy(db.connection, "startTransaction");
            const spy2 = sinon.spy(db.connection, "commitTransaction");
            const spy3 = sinon.spy(db.connection, "rollbackTransaction");
            await db.transaction(async () => {
                // do someting here
            });

            chai.should();
            spy1.should.be.calledOnceWith(undefined);
            spy2.should.be.calledOnceWith();
            spy2.should.be.calledAfter(spy1);
            spy.should.be.calledOnce.and.calledAfter(spy2);
            spy3.should.not.be.called;
        });
        it("should rollback", async () => {
            const spy = sinon.spy(db, "closeConnection");
            const spy1 = sinon.spy(db.connection, "startTransaction");
            const spy2 = sinon.spy(db.connection, "commitTransaction");
            const spy3 = sinon.spy(db.connection, "rollbackTransaction");

            try {
                await db.transaction(async () => {
                    // do someting here
                    throw new Error("test rollback transaction");
                });
            }
            catch {

            }

            chai.should();
            spy1.should.be.calledOnceWith(undefined);
            spy3.should.be.calledAfter(spy1).and.calledOnceWith();
            spy.should.be.calledOnce.and.calledAfter(spy3);
            spy2.should.not.be.calledOnce;
        });
        it("should start transactin with specifix isolation level", async () => {
            const isolationLevels: IsolationLevel[] = ["READ COMMITTED", "READ UNCOMMITTED", "REPEATABLE READ", "SERIALIZABLE", "SNAPSHOT"];
            const il = isolationLevels[Math.floor(Math.random() * 6)];
            const spy = sinon.spy(db, "closeConnection");
            const spy1 = sinon.spy(db.connection, "startTransaction");
            const spy2 = sinon.spy(db.connection, "commitTransaction");
            const spy3 = sinon.spy(db.connection, "rollbackTransaction");
            const con = db.connection;
            const oil = con.isolationLevel;
            await db.transaction(il, async () => {
                // do someting here
                expect(con.isolationLevel).to.equal(il);
            });

            expect(con.isolationLevel).to.equal(oil);

            chai.should();
            spy1.should.be.calledOnceWith(il);
            spy2.should.be.calledOnceWith();
            spy2.should.be.calledAfter(spy1);
            spy.should.be.calledOnce.and.calledAfter(spy2);
            spy3.should.not.be.called;
        });
        it("should set isolation level", async () => {
            const isolationLevels: IsolationLevel[] = ["READ COMMITTED", "READ UNCOMMITTED", "REPEATABLE READ", "SERIALIZABLE", "SNAPSHOT"];
            const il = isolationLevels[Math.floor(Math.random() * 6)];
            const spy = sinon.spy(db, "closeConnection");
            const spy1 = sinon.spy(db.connection, "startTransaction");
            const spy2 = sinon.spy(db.connection, "commitTransaction");
            const spy3 = sinon.spy(db.connection, "rollbackTransaction");
            const con = db.connection;
            const oil = con.isolationLevel;
            await db.transaction(async () => {
                await db.connection.setIsolationLevel(il);
                // do someting here
                expect(con.isolationLevel).to.equal(il);
            });

            expect(con.isolationLevel).to.equal(oil);

            chai.should();
            spy1.should.be.calledOnceWith();
            spy2.should.be.calledOnceWith();
            spy2.should.be.calledAfter(spy1);
            spy.should.be.calledOnce.and.calledAfter(spy2);
            spy3.should.not.be.called;
        });
        it("should worked nested 1", async () => {
            const spy = sinon.spy(db, "closeConnection");
            const spy1 = sinon.spy(db.connection, "startTransaction");
            const spy2 = sinon.spy(db.connection, "commitTransaction");
            const spy3 = sinon.spy(db.connection, "rollbackTransaction");
            await db.transaction(async () => {
                await db.transaction(async () => {
                    // do someting here
                });
            });

            chai.should();
            spy1.should.be.calledTwice;
            spy2.should.be.calledTwice;
            spy.should.be.calledOnce;
            spy3.should.not.be.called;
        });
        it("should worked nested 2", async () => {
            const spy = sinon.spy(db, "closeConnection");
            const spy1 = sinon.spy(db.connection, "startTransaction");
            const spy2 = sinon.spy(db.connection, "commitTransaction");
            const spy3 = sinon.spy(db.connection, "rollbackTransaction");
            try {
                await db.transaction(async () => {
                    await db.transaction(async () => {
                        // do someting here
                        throw new Error("test rollback transaction");
                    });
                });
            }
            catch { }

            chai.should();
            spy1.should.be.calledTwice;
            spy3.should.be.calledTwice;
            spy.should.be.calledOnce;
            spy2.should.not.be.called;
        });
        it("should worked nested 3", async () => {
            const spy = sinon.spy(db, "closeConnection");
            const spy1 = sinon.spy(db.connection, "startTransaction");
            const spy2 = sinon.spy(db.connection, "commitTransaction");
            const spy3 = sinon.spy(db.connection, "rollbackTransaction");
            await db.transaction(async () => {
                try {
                    await db.transaction(async () => {
                        // do someting here
                        throw new Error("test rollback transaction");
                    });
                }
                catch { }
            });

            chai.should();
            spy1.should.be.calledTwice;
            spy2.should.be.calledOnce;
            spy3.should.be.calledOnce.and.calledBefore(spy2);
            spy.should.be.calledOnce;
        });
    });
});

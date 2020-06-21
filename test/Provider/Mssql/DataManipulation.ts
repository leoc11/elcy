import * as chai from "chai";
import * as chaiPromise from "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import { QueryType } from "../../../src/Common/Enum";
import { Uuid } from "../../../src/Common/Uuid";
import { IConnection } from "../../../src/Connection/IConnection";
import { PooledConnection } from "../../../src/Connection/PooledConnection";
import { EntityState } from "../../../src/Data/EntityState";
import { entityMetaKey, relationMetaKey } from "../../../src/Decorator/DecoratorKey";
import { IDeleteEventParam } from "../../../src/MetaData/Interface/IDeleteEventParam";
import { IEntityMetaData } from "../../../src/MetaData/Interface/IEntityMetaData";
import { ISaveEventParam } from "../../../src/MetaData/Interface/ISaveEventParam";
import { RelationMetaData } from "../../../src/MetaData/Relation/RelationMetaData";
import { MockConnection } from "../../../src/Mock/MockConnection";
import { mockContext } from "../../../src/Mock/MockContext";
import { IQuery } from "../../../src/Query/IQuery";
import { AutoDetail, AutoParent, Order, OrderDetail, Product } from "../../Common/Model";
import { AutoDetailDesc } from "../../Common/Model/AutoDetailDesc";
import { MssqlDb } from "./MssqlDb";

chai.use(sinonChai);
chai.use(chaiPromise);
const db = new MssqlDb();
mockContext(db);
beforeEach(async () => {
    db.connection = await db.getConnection();
    db.connectionManager.getAllConnections = () => Promise.resolve([db.connection]);
});
afterEach(() => {
    db.clear();
    sinon.restore();
    db.closeConnection();
});
const getConnection = (con: IConnection) => (con instanceof PooledConnection ? con.connection : con) as MockConnection;

describe("DATA MANIPULATION", () => {
    describe("INSERT", () => {
        it("should insert new entity 1", async () => {
            const spy = sinon.spy(db.connection, "query");

            const productId = Uuid.new();
            const effected = await db.products.insert({
                ProductId: productId,
                Price: 10000
            });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t(@param0,@param1)`,
                type: QueryType.DML,
                parameters: { param0: productId, param1: 10000 }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should insert new entity 2", async () => {
            const spy = sinon.spy(db.connection, "query");

            const product = new Product();
            product.ProductId = Uuid.new();
            product.Price = 10000;
            db.add(product);
            const effected = await db.saveChanges();

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t(@param0,@param1)`,
                type: QueryType.DML,
                parameters: { param0: product.ProductId, param1: product.Price }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should insert new entity 3", async () => {
            const spy = sinon.spy(db.connection, "query");

            const product = db.products.new({
                ProductId: Uuid.new(),
                Price: 10000
            });
            const effected = await db.saveChanges();

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t(@param0,@param1)`,
                type: QueryType.DML,
                parameters: { param0: product.ProductId, param1: product.Price }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should insert new entity and update all insert generated column (createdDate, default)", async () => {
            const spy = sinon.spy(db.connection, "query");

            const data = db.autoParents.new({
                name: "Insert 1",
                createdDate: null,
                modifiedDate: null
            });
            const effected = await db.saveChanges();

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "INSERT INTO [AutoParent]([name], [isDefault], [isDeleted]) OUTPUT INSERTED.[id] AS id, INSERTED.[isDefault] AS isDefault, INSERTED.[isDeleted] AS isDeleted, INSERTED.[createdDate] AS createdDate, INSERTED.[modifiedDate] AS modifiedDate VALUES\n\t(@param0,DEFAULT,DEFAULT)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: "Insert 1" }
            } as IQuery);
            data.should.has.property("isDeleted").that.equal(false);
            data.should.has.property("isDefault").that.equal(true);
            data.should.has.property("createdDate").that.is.an.instanceOf(Date);
            data.should.has.property("modifiedDate").that.is.an.instanceOf(Date);
            data.should.has.property("id").that.is.a("number").and.greaterThan(0);
        });
        it("should insert entity with it relation correctly", async () => {
            const spy = sinon.spy(db.connection, "query");
            const data = db.autoParents.new({
                name: "Insert 1",
                createdDate: null,
                modifiedDate: null
            });
            const detail1 = db.autoDetails.new({ description: "detail 1" });
            const detail2 = db.autoDetails.new({ description: "detail 2" });

            data.details = [];
            data.details.push(detail1);
            data.details.push(detail2);

            const data2 = db.autoParents.new({
                name: "Insert 2",
                createdDate: null,
                modifiedDate: null
            });
            const detail21 = db.autoDetails.new({ description: "detail 21" });
            data2.details = [];
            data2.details.push(detail21);

            const effected = await db.saveChanges();
            chai.should();
            effected.should.equal(5);
            spy.should.have.been.calledTwice;
            spy.should.have.been.calledWithMatch({
                type: 3,
                query: "INSERT INTO [AutoParent]([name], [isDefault], [isDeleted]) OUTPUT INSERTED.[id] AS id, INSERTED.[isDefault] AS isDefault, INSERTED.[isDeleted] AS isDeleted, INSERTED.[createdDate] AS createdDate, INSERTED.[modifiedDate] AS modifiedDate VALUES\n\t(@param0,DEFAULT,DEFAULT)",
                parameters: { param0: "Insert 1" }
            }, {
                type: 3,
                query: "INSERT INTO [AutoParent]([name], [isDefault], [isDeleted]) OUTPUT INSERTED.[id] AS id, INSERTED.[isDefault] AS isDefault, INSERTED.[isDeleted] AS isDeleted, INSERTED.[createdDate] AS createdDate, INSERTED.[modifiedDate] AS modifiedDate VALUES\n\t(@param0,DEFAULT,DEFAULT)",
                parameters: { param0: "Insert 2" }
            });

            spy.should.have.been.calledWithMatch({
                type: 3,
                query: "INSERT INTO [AutoDetail]([parentId], [description]) OUTPUT INSERTED.[id] AS id, INSERTED.[parentId] AS parentId, INSERTED.[version] AS version VALUES\n\t(@param1,@param0)",
                parameters: { param0: "detail 1", param1: data.id }
            }, {
                type: 3,
                query: "INSERT INTO [AutoDetail]([parentId], [description]) OUTPUT INSERTED.[id] AS id, INSERTED.[parentId] AS parentId, INSERTED.[version] AS version VALUES\n\t(@param1,@param0)",
                parameters: { param0: "detail 2", param1: data.id }
            }, {
                type: QueryType.DML | QueryType.DQL,
                query: "INSERT INTO [AutoDetail]([parentId], [description]) OUTPUT INSERTED.[id] AS id, INSERTED.[parentId] AS parentId, INSERTED.[version] AS version VALUES\n\t(@param1,@param0)",
                parameters: { param0: "detail 21", param1: data2.id }
            });

            data.should.has.property("isDeleted").that.equal(false);
            data.should.has.property("isDefault").that.equal(true);
            data.should.has.property("createdDate").that.is.an.instanceOf(Date);
            data.should.has.property("modifiedDate").that.is.an.instanceOf(Date);
            data.should.has.property("id").that.is.a("number").and.greaterThan(0);

            data.should.has.property("details").that.is.an("array").and.have.lengthOf(2);
            for (const d of data.details) {
                d.should.has.property("description").that.is.a("string");
                d.should.has.property("id").that.is.a("number").and.greaterThan(0);
                d.should.has.property("parent").that.equal(data);
                d.should.has.property("parentId").that.equal(data.id);
            }
        });
        it("should trigger before/after save event", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = sinon.spy(entityMetaData, "beforeSave");
            const spy2 = sinon.spy(entityMetaData, "afterSave");

            const data = db.autoParents.new({
                name: "Insert 1",
                createdDate: null,
                modifiedDate: null
            });
            const effected = await db.saveChanges();

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch(data, { type: "insert" } as ISaveEventParam);
            spy2.should.have.been.calledOnce.and.calledWithMatch(data, { type: "insert" } as ISaveEventParam);
            spy.should.be.calledBefore(spy2);
        });
        it("should bulk insert", async () => {
            const spy = sinon.spy(db.connection, "query");

            const effected = await db.autoParents.where((o) => o.details.count() <= 0).insertInto(AutoDetail, (o) => ({
                description: "Detail of parent " + o.id
            }));

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "INSERT INTO [AutoDetail] ([description])\nSELECT ('Detail of parent '+CAST([entity0].[id] AS nvarchar(255))) AS [column1]\nFROM [AutoParent] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[parentId],\n\t\tCOUNT([entity1].[id]) AS [column0]\n\tFROM [AutoDetail] AS [entity1]\n\tGROUP BY [entity1].[parentId]\n) AS [entity1]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity1].[column0]<=0))",
                type: QueryType.DML,
                parameters: {}
            } as IQuery);
            effected.should.be.greaterThan(0);
        });
    });
    describe("UPDATE", () => {
        it("should update entity 1", async () => {
            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            chai.should();
            entry.state.should.equal(EntityState.Modified);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[modifiedDate] = getutcdate(), [entity0].[name] = @param1\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1, param1: "Updated" }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should bulk update entity 1", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.where((o) => o.id === 1).update({
                name: "Updated",
                isDefault: (o) => !o.isDefault
            });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[name] = 'Updated', [entity0].[isDefault] = (\n\tCASE WHEN (NOT(\n\t\t([entity0].[isDefault]=1)\n\t)) \n\tTHEN 1\n\tELSE 0\n\tEND\n), [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                type: QueryType.DML,
                parameters: {}
            } as IQuery);
            effected.should.equal(1);
        });
        it("should bulk update entity 2", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.update({
                id: 1,
                name: "Updated",
                isDefault: false
            });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[modifiedDate] = getutcdate(), [entity0].[name] = @param1, [entity0].[isDefault] = @param2\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1, param1: "Updated", param2: false }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should update with DIRTY concurrency check", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "OPTIMISTIC DIRTY";

            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            chai.should();
            entry.state.should.equal(EntityState.Modified);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[modifiedDate] = getutcdate(), [entity0].[name] = @param2\nFROM [AutoParent] AS [entity0]\nWHERE ((([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))) AND ([entity0].[name]=@param1 OR ([entity0].[name] IS NULL AND @param1 IS NULL)))",
                parameters: { param0: 1, param1: "Original", param2: "Updated" }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should update with VERSION concurrency check", async () => {
            const spy = sinon.spy(db.connection, "query");

            const parent = new AutoDetail();
            parent.id = 1;
            parent.description = "Original";
            const oldVersion = parent.version = new Uint8Array([1, 200, 0, 0, 100]);
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.description = "Updated";

            chai.should();
            entry.state.should.equal(EntityState.Modified);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[description] = @param2\nFROM [AutoDetail] AS [entity0]\nWHERE (([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)) AND ([entity0].[version]=@param1 OR ([entity0].[version] IS NULL AND @param1 IS NULL)))",
                parameters: { param0: 1, param1: oldVersion, param2: "Updated" }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[version]\nFROM [AutoDetail] AS [entity0]\nWHERE ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should update with VERSION concurrency check (fallback to ModifiedDate)", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "OPTIMISTIC VERSION";

            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const oldModifiedDate = Date.timestamp();
            parent.modifiedDate = oldModifiedDate;
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            chai.should();
            entry.state.should.equal(EntityState.Modified);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[modifiedDate] = getutcdate(), [entity0].[name] = @param2\nFROM [AutoParent] AS [entity0]\nWHERE ((([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))) AND ([entity0].[modifiedDate]=@param1 OR ([entity0].[modifiedDate] IS NULL AND @param1 IS NULL)))",
                parameters: { param0: parent.id, param1: oldModifiedDate.toUTCDate(), param2: "Updated" }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: parent.id }
            });
            effected.should.equal(1);
        });
        it("should update without concurrency check", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "NONE";

            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            chai.should();
            entry.state.should.equal(EntityState.Modified);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[modifiedDate] = getutcdate(), [entity0].[name] = @param1\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1, param1: "Updated" }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should throw concurrency error", async () => {
            const parent = new AutoDetail();
            parent.id = 1;
            parent.description = "Original";
            parent.version = new Uint8Array([1, 200, 0, 0, 100]);
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.description = "Updated";

            chai.should();
            const mockConnection = getConnection(db.connection);
            mockConnection.results = [{
                effectedRows: 0
            }, {
                rows: []
            }];
            const promise = db.saveChanges();
            await promise.should.eventually.be.rejectedWith("DbUpdateConcurrencyException");
            mockConnection.results = null;
        });
        it("should update ModifiedDate", async () => {
            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            await db.saveChanges();

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[modifiedDate] = getutcdate(), [entity0].[name] = @param1\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1, param1: "Updated" }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
        });
        it("should not update Readonly Column, ex: CreatedDate", async () => {
            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.attach(parent);
            parent.createdDate = new Date();
            parent.modifiedDate = new Date();

            chai.should();
            entry.state.should.equal(EntityState.Unchanged);

            parent.name = "Updated";

            entry.state.should.equal(EntityState.Modified);

            parent.createdDate = new Date();
            parent.modifiedDate = new Date();

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[modifiedDate] = getutcdate(), [entity0].[name] = @param1\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1, param1: "Updated" }
            }, {
                type: 1,
                query: "SELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should trigger before/after save event", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = sinon.spy(entityMetaData, "beforeSave");
            const spy2 = sinon.spy(entityMetaData, "afterSave");

            const data = new AutoParent();
            data.id = 1;
            data.name = "Original";
            db.attach(data);
            data.name = "Updated";
            const effected = await db.saveChanges();

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch(data, { type: "update" } as ISaveEventParam);
            spy2.should.have.been.calledOnce.and.calledWithMatch(data, { type: "update" } as ISaveEventParam);
            spy.should.be.calledBefore(spy2);
        });
    });
    describe("DELETE", () => {
        it("should delete entity (soft delete) + should update modifiedDate", async () => {
            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.delete(parent);

            chai.should();
            entry.state.should.equal(EntityState.Deleted);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should delete entity (hard delete)", async () => {
            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.delete(parent);

            chai.should();
            entry.state.should.equal(EntityState.Deleted);

            const effected = await db.saveChanges({
                forceHardDelete: true
            });

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.equal(1);
        });
        it("should bulk delete with include (soft delete) 1", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.include((o) => o.details).delete((o) => o.id === 1);

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                parameters: {}
            }, {
                type: 2, query: "DELETE [entity1]\nFROM [AutoDetail] AS [entity1]\nINNER JOIN [AutoParent] AS [entity0]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                parameters: {}
            });
            effected.should.be.greaterThan(0);
        });
        it("should bulk delete (soft delete) 2", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.delete((o) => o.id === 1);

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                parameters: {}
            });
            effected.should.be.greaterThan(0);
        });
        it("should bulk delete (soft delete) 3", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.delete({
                id: 1
            });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.be.greaterThan(0);
        });
        it("should bulk delete with include (hard delete) 1", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.include((o) => o.details)
                .where((o) => o.id === 1)
                .delete("hard");

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                parameters: {}
            }, {
                type: 2,
                query: "DELETE [entity1]\nFROM [AutoDetail] AS [entity1]\nINNER JOIN [AutoParent] AS [entity0]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                parameters: {}
            });
            effected.should.be.greaterThan(0);
        });
        it("should bulk delete (hard delete) 2", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.delete((o) => o.id === 1, "hard");

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                parameters: {}
            });
            effected.should.be.greaterThan(0);
        });
        it("should bulk delete (hard delete) 3", async () => {
            const spy = sinon.spy(db.connection, "query");
            const effected = await db.autoParents.delete({
                id: 1
            }, "hard");

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });
            effected.should.be.greaterThan(0);
        });
        it("should fail soft delete for not supported entity", async () => {
            const promise = db.autoParents.include((o) => o.details)
                .where((o) => o.id === 1)
                .delete("soft");

            promise.should.eventually.be.rejectedWith("'AutoDetail' did not support 'Soft' delete");
        });
        // it("should fail hard delete when relation still exist", async () => { });
        it("should cascade delete entity + relation (soft delete)", async () => {
            const spy = sinon.spy(db.connection, "query");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "CASCADE";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should delete with SET NULL option (soft delete)", async () => {
            const spy = sinon.spy(db.connection, "query");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "SET NULL";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should delete with SET DEFAULT option (soft delete)", async () => {
            const spy = sinon.spy(db.connection, "query");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "SET DEFAULT";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: 1 }
            });

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should trigger before/after delete event", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = sinon.spy(entityMetaData, "beforeDelete");
            const spy2 = sinon.spy(entityMetaData, "afterDelete");

            const data = new AutoParent();
            data.id = 1;
            db.delete(data);
            const effected = await db.saveChanges();

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch(data, { mode: "soft" } as IDeleteEventParam);
            spy2.should.have.been.calledOnce.and.calledWithMatch(data, { mode: "soft" } as IDeleteEventParam);
            spy.should.be.calledBefore(spy2);
        });
    });
    describe("UPSERT", () => {
        it("should upsert new entity 1", async () => {
            const spy = sinon.spy(db.connection, "query");

            const productId = Uuid.new();
            const effected = await db.products.upsert({
                ProductId: productId,
                Price: 10000
            });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "MERGE INTO [Products] AS [entity0]\nUSING (SELECT @param0 AS [ProductId]) AS _VAL ON _VAL.[ProductId] = [entity0].[ProductId]\nWHEN MATCHED THEN\n\tUPDATE SET [Price] = @param1\nWHEN NOT MATCHED THEN\n\tINSERT ([ProductId],[Price])\n\tVALUES (@param0,@param1)",
                parameters: { param0: productId, param1: 10000 }
            });
            effected.should.equal(1);
        });
        it("should upsert new entity 2", async () => {
            const spy = sinon.spy(db.connection, "query");

            const product = new Product();
            product.ProductId = Uuid.new();
            product.Price = 10000;
            db.add(product);
            const effected = await db.saveChanges({ useUpsert: true });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "MERGE INTO [Products] AS [entity0]\nUSING (SELECT @param0 AS [ProductId]) AS _VAL ON _VAL.[ProductId] = [entity0].[ProductId]\nWHEN MATCHED THEN\n\tUPDATE SET [Price] = @param1\nWHEN NOT MATCHED THEN\n\tINSERT ([ProductId],[Price])\n\tVALUES (@param0,@param1)",
                parameters: { param0: product.ProductId, param1: 10000 }
            });
            effected.should.equal(1);
        });
        it("should upsert new entity 3", async () => {
            const spy = sinon.spy(db.connection, "query");

            const product = db.products.new({
                ProductId: Uuid.new(),
                Price: 10000
            });
            const effected = await db.saveChanges({ useUpsert: true });

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "MERGE INTO [Products] AS [entity0]\nUSING (SELECT @param0 AS [ProductId]) AS _VAL ON _VAL.[ProductId] = [entity0].[ProductId]\nWHEN MATCHED THEN\n\tUPDATE SET [Price] = @param1\nWHEN NOT MATCHED THEN\n\tINSERT ([ProductId],[Price])\n\tVALUES (@param0,@param1)",
                parameters: { param0: product.ProductId, param1: 10000 }
            });
            effected.should.equal(1);
        });
        // NOTE: Somehow CI failed.
        // it("should upsert entity 4", async () => {
        //     const spy = sinon.spy(db.connection, "query");
        //     const parent = new AutoParent();
        //     parent.id = 1;
        //     parent.name = "Original";
        //     const entry = db.entry(parent);
        //     entry.state = EntityState.Unchanged;
        //     parent.name = "Updated";
        //     chai.should();
        //     entry.state.should.equal(EntityState.Modified);
        //     const effected = await db.saveChanges({ useUpsert: true });
        //     spy.should.have.been.calledWithMatch({
        //        type: 2,
        //         query: "MERGE INTO [AutoParent] AS [entity0]\nUSING (SELECT @param0 AS [id]) AS _VAL ON _VAL.[id] = [entity0].[id]\nWHEN MATCHED THEN\n\tUPDATE SET [name] = @param1,\n\t\t[modifiedDate] = getutcdate()\nWHEN NOT MATCHED THEN\n\tINSERT ([name],[isDefault],[isDeleted])\n\tVALUES (@param1,DEFAULT,DEFAULT)",
        //         parameters: { param0: 1, param1: "Updated" }
        //     }, {
        //         type: 1,
        //         query: "SELECT [entity0].[id],\n\t[entity0].[createdDate],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)",
        //         parameters: { param0: 1, param1: "Updated" }
        //     });
        //     effected.should.equal(1);
        // });
        it("should trigger before/after save event 1", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = sinon.spy(entityMetaData, "beforeSave");
            const spy2 = sinon.spy(entityMetaData, "afterSave");

            const data = db.autoParents.new({
                name: "Insert 1",
                createdDate: null,
                modifiedDate: null
            });
            const effected = await db.saveChanges({ useUpsert: true });

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch(data, { type: "insert" } as ISaveEventParam);
            spy2.should.have.been.calledOnce.and.calledWithMatch(data, { type: "insert" } as ISaveEventParam);
            spy.should.be.calledBefore(spy2);
        });
        it("should trigger before/after save event 2", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = sinon.spy(entityMetaData, "beforeSave");
            const spy2 = sinon.spy(entityMetaData, "afterSave");

            const data = new AutoParent();
            data.id = 1;
            data.name = "Original";
            db.attach(data);
            data.name = "Updated";
            const effected = await db.saveChanges({ useUpsert: true });

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch(data, { type: "update" } as ISaveEventParam);
            spy2.should.have.been.calledOnce.and.calledWithMatch(data, { type: "update" } as ISaveEventParam);
            spy.should.be.calledBefore(spy2);
        });
    });
    describe("RELATION STATE", () => {
        it("should add new relation", () => {
            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            const detailDesc = new AutoDetailDesc();
            detailDesc.desc = "description";
            db.attach(detail);

            detail.autoDetailDesc = detailDesc;
            db.relationEntries.add.size.should.equal(1);
        });
        it("should not have any changes", () => {
            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            const detailDesc = new AutoDetailDesc();
            detailDesc.id = 10;
            detailDesc.desc = "description";
            db.attach(detail);

            detail.autoDetailDesc = detailDesc;
            db.relationEntries.add.size.should.equal(0);
        });
        it("should delete relation", () => {
            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            const detailDesc = new AutoDetailDesc();
            detailDesc.id = 10;
            detailDesc.desc = "description";
            db.attach(detailDesc);

            detail.autoDetailDesc = null;
            db.relationEntries.delete.size.should.equal(1);
        });
    });
    describe("ADD RELATION", () => {
        it("should add one-one relation", async () => {
            const spy = sinon.spy(db.connection, "query");
            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            const detailDesc = new AutoDetailDesc();
            detailDesc.desc = "description";
            db.attach(detail);

            detail.autoDetailDesc = detailDesc;
            chai.should();
            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[id] = @param1\nFROM [AutoDetailDesc] AS [entity0]\nWHERE ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))",
                parameters: { param0: 10, param1: 10 }
            });
            effected.should.equal(1);
        });
        it("should add one-many relation", async () => {
            const spy = sinon.spy(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            db.attach(parent);

            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            parent.details = [detail];
            chai.should();
            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[parentId] = @param1\nFROM [AutoDetail] AS [entity0]\nWHERE ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))",
                parameters: { param0: 10, param1: 1 }
            });
            effected.should.equal(1);
        });
        // it("should add many-many relation", () => {
        // });
        // it("should add relation data", () => {
        // });
        // it("should update relation data", () => {
        // });
    });
    describe("REMOVE RELATION", () => {
        it("should remove one-one/one-many relation by DELETE", async () => {
            const spy = sinon.spy(db.connection, "query");
            const detailDesc = new AutoDetailDesc();
            detailDesc.id = 10;
            detailDesc.desc = "description";
            db.attach(detailDesc);

            const parent = new AutoParent();
            parent.id = 1;
            db.attach(parent);

            const detail = new AutoDetail();
            detail.id = 10;
            detail.parentId = parent.id;
            detail.parent = parent;
            db.attach(detail, true);

            detail.parent = null;
            detail.autoDetailDesc = null;

            const effected = await db.saveChanges();

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "DELETE [entity0]\nFROM [AutoDetailDesc] AS [entity0]\nWHERE ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))",
                parameters: { param0: 10 }
            }, {
                type: 2,
                query: "DELETE [entity0]\nFROM [AutoDetail] AS [entity0]\nWHERE ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))",
                parameters: { param0: 10 }
            });
            effected.should.equal(2);
        });
        it("should remove one-one/one-many relation by SET NULL", async () => {
            const spy = sinon.spy(db.connection, "query");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.nullable = true;

            const parent = new AutoParent();
            parent.id = 1;
            db.attach(parent);

            const detail = new AutoDetail();
            detail.id = 10;
            detail.parentId = parent.id;
            db.attach(detail);

            detail.parent = null;
            const effected = await db.saveChanges();

            relationMeta.nullable = false;

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 2,
                query: "DELETE [entity0]\nFROM [AutoDetail] AS [entity0]\nWHERE ([entity0].[id]=@param0 OR ([entity0].[id] IS NULL AND @param0 IS NULL))",
                parameters: { param0: 10 }
            });
            effected.should.equal(1);
        });
        // it("should remove many-many relation", () => {
        // });
        // it("should remove relation data", () => {
        // });
    });
    describe("SAVE CHANGES", () => {
        it("should bulk insert/update/delete entity and relation", async () => {
            const spy = sinon.spy(db.connection, "query");
            const order = new Order({ OrderId: Uuid.new(), TotalAmount: 10000 });
            const order2 = new Order({ OrderId: Uuid.new(), TotalAmount: 10000 });
            const orderDetail = new OrderDetail({ OrderId: order.OrderId, OrderDetailId: Uuid.new(), name: "test1" });
            const orderDetail2 = new OrderDetail({ OrderId: order.OrderId, OrderDetailId: Uuid.new(), name: "test2" });
            const orderDetail3 = new OrderDetail({ OrderId: order2.OrderId, OrderDetailId: Uuid.new(), name: "test3" });
            db.attach(order);
            db.attach(order2);
            db.attach(orderDetail);
            db.attach(orderDetail2);
            db.attach(orderDetail3);

            // delete
            db.delete(orderDetail);
            // update
            order.TotalAmount = 20000;
            // insert
            const newOd = db.orderDetails.new({ OrderDetailId: Uuid.new(), OrderId: order.OrderId, name: "test2", quantity: 1 });
            // delete relation
            db.relationDelete(order, "OrderDetails", orderDetail2);
            // change relation (delete, add)
            orderDetail3.Order = order;

            const effected = await db.saveChanges();

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                type: 3,
                query: "INSERT INTO [OrderDetails]([OrderDetailId], [OrderId], [ProductId], [ProductName], [Quantity], [isDeleted]) OUTPUT INSERTED.[CreatedDate] AS CreatedDate, INSERTED.[isDeleted] AS isDeleted VALUES\n\t(@param0,@param1,@param5,@param3,@param4,DEFAULT)",
                parameters: { param0: newOd.OrderDetailId, param1: newOd.OrderId, param5: newOd.ProductId || null, param3: newOd.name, param4: newOd.quantity }
            }, {
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[TotalAmount] = @param1\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[OrderId]=@param0 OR ([entity0].[OrderId] IS NULL AND @param0 IS NULL))",
                parameters: { param0: order.OrderId, param1: order.TotalAmount }
            }, {
                type: 2, query: "UPDATE [entity0]\nSET [entity0].[OrderId] = @param1\nFROM [OrderDetails] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[OrderDetailId]=@param0 OR ([entity0].[OrderDetailId] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: orderDetail3.OrderDetailId, param1: order.OrderId }
            }, {
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[OrderId] = NULL\nFROM [OrderDetails] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[OrderDetailId]=@param0 OR ([entity0].[OrderDetailId] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: orderDetail2.OrderDetailId }
            }, {
                type: 2,
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1\nFROM [OrderDetails] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[OrderDetailId]=@param0 OR ([entity0].[OrderDetailId] IS NULL AND @param0 IS NULL)))",
                parameters: { param0: orderDetail.OrderDetailId }
            });
            effected.should.equal(5);
        });
        // it("should failed without changing context state", async () => {});
    });
});

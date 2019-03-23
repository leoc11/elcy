import "../../../src/Extensions";
import { MyDb } from "../../Common/MyDb";
import { mockContext } from "../../../src/Connection/Mock/MockContext";
import { Product, AutoParent, AutoDetail } from "../../Common/Model";
import { UUID } from "../../../src/Data/UUID";
import "mocha";
import * as sinon from "sinon";
import * as chai from "chai";
import * as sinonChai from "sinon-chai";
import * as chaiPromise from "chai-as-promised";
import { QueryType } from "../../../src/Common/Type";
import { IQuery } from "../../../src/Query/IQuery";
import { ISaveEventParam } from "../../../src/MetaData/Interface/ISaveEventParam";
import { entityMetaKey, relationMetaKey } from "../../../src/Decorator/DecoratorKey";
import { IEntityMetaData } from "../../../src/MetaData/Interface/IEntityMetaData";
import { EntityState } from "../../../src/Data/EntityState";
import { IDeleteEventParam } from "../../../src/MetaData/Interface/IDeleteEventParam";
import { RelationMetaData } from "../../../src/MetaData/Relation/RelationMetaData";

chai.use(sinonChai);
chai.use(chaiPromise);
const db = new MyDb();
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

describe("DATA MANIPULATION", () => {
    describe("INSERT", () => {
        it("should insert new entity 1", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");

            const productId = UUID.new();
            const effected = await db.products.insert({
                ProductId: productId,
                Price: 10000
            });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t('${productId.toString()}',10000)`,
                type: QueryType.DML,
                parameters: {}
            } as IQuery);
            effected.should.equal(1);
        });
        it("should insert new entity 2", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");

            const product = new Product();
            product.ProductId = UUID.new();
            product.Price = 10000;
            db.add(product);
            const effected = await db.saveChanges();

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t(@param0,@param1)`,
                type: QueryType.DML,
                parameters: { "param0": product.ProductId, "param1": product.Price }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should insert new entity 3", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");

            const product = db.products.new({
                ProductId: UUID.new(),
                Price: 10000
            });
            const effected = await db.saveChanges();

            chai.should();
            effected.should.equal(1);
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t(@param0,@param1)`,
                type: QueryType.DML,
                parameters: { "param0": product.ProductId, "param1": product.Price }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should insert new entity and update all insert generated column (createdDate, default)", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");

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
            const spy = sinon.spy(db.connection, "executeQuery");

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

            const effected = await db.saveChanges();
            chai.should();
            effected.should.equal(3);
            spy.should.have.been.calledWithMatch({
                query: `INSERT INTO [AutoParent]([name], [isDefault], [isDeleted]) OUTPUT INSERTED.[id] AS id, INSERTED.[isDefault] AS isDefault, INSERTED.[isDeleted] AS isDeleted, INSERTED.[createdDate] AS createdDate, INSERTED.[modifiedDate] AS modifiedDate VALUES\n\t(@param0,DEFAULT,DEFAULT)`,
                type: QueryType.DML | QueryType.DQL,
                parameters: { "param0": "Insert 1" }
            } as IQuery);
            spy.should.have.been.calledWithMatch({
                query: `INSERT INTO [AutoDetail]([parentId], [description]) OUTPUT INSERTED.[id] AS id, INSERTED.[parentId] AS parentId, INSERTED.[version] AS version VALUES\n\t(@param2,@param0),\n\t(@param2,@param1)`,
                type: QueryType.DML | QueryType.DQL,
                parameters: { "param0": "detail 1", "param2": data.id, "param1": "detail 2" }
            } as IQuery);
            data.should.has.property("isDeleted").that.equal(false);
            data.should.has.property("isDefault").that.equal(true);
            data.should.has.property("createdDate").that.is.an.instanceOf(Date);
            data.should.has.property("modifiedDate").that.is.an.instanceOf(Date);
            data.should.has.property("id").that.is.a("number").and.greaterThan(0);

            data.should.has.property("details").that.is.an("array").and.have.lengthOf(2);
            data.details.each(d => {
                d.should.has.property("description").that.is.a("string");
                d.should.has.property("id").that.is.a("number").and.greaterThan(0);
                d.should.has.property("parentId").that.equal(data.id);
                d.should.has.property("parent").that.equal(data);
            });
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
            const spy = sinon.spy(db.connection, "executeQuery");

            const effected = await db.autoParents.where(o => o.details.count() <= 0).select(AutoDetail, o => ({
                description: "Detail of parent " + o.id
            })).insertInto(AutoDetail);

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
            const spy = sinon.spy(db.connection, "executeQuery");
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
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: 1, param1: "Updated" }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should bulk update entity", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const effected = await db.autoParents.where(o => o.id === 1).update({
                name: "Updated",
                isDefault: o => !o.isDefault
            });

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[name] = 'Updated', [entity0].[isDefault] = (\n\tCASE WHEN (NOT(\n\t\t([entity0].[isDefault]=1)\n\t)) \n\tTHEN 1\n\tELSE 0\n\tEND\n), [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                type: QueryType.DML,
                parameters: {}
            } as IQuery);
            effected.should.equal(1);
        });
        it("should update with DIRTY concurrency check", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "OPTIMISTIC DIRTY";

            const spy = sinon.spy(db.connection, "executeQuery");
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
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE (([entity0].[id]=@param0) AND ([entity0].[name]=@param2));\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: 1, param1: "Updated", param2: "Original" }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should update with VERSION concurrency check", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");

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
                query: "UPDATE [entity0]\nSET [entity0].[description] = @param1\nFROM [AutoDetail] AS [entity0] \nWHERE (([entity0].[id]=@param0) AND ([entity0].[version]=@param2));\n\nSELECT [entity0].[id],\n\t[entity0].[version]\nFROM [AutoDetail] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: 1, param1: "Updated", param2: oldVersion }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should update with VERSION concurrency check (fallback to ModifiedDate)", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "OPTIMISTIC VERSION";

            const spy = sinon.spy(db.connection, "executeQuery");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const oldModifiedDate = Date.utcTimestamp();
            parent.modifiedDate = oldModifiedDate;
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            chai.should();
            entry.state.should.equal(EntityState.Modified);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE (([entity0].[id]=@param0) AND ([entity0].[modifiedDate]=@param2));\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: 1, param1: "Updated", param2: oldModifiedDate.toUTCDate() }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should update without concurrency check", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "NONE";

            const spy = sinon.spy(db.connection, "executeQuery");
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
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: 1, param1: "Updated" }
            } as IQuery);
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
            const promise = db.saveChanges();
            promise.should.eventually.be.rejectedWith("Concurrency Error");
        });
        it("should update ModifiedDate", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            chai.should();
            await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: 1, param1: "Updated" }
            } as IQuery);
        });
        it("should not update Readonly Column, ex: CreatedDate", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
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

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: { param0: 1, param1: "Updated" }
            } as IQuery);
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
            const spy = sinon.spy(db.connection, "executeQuery");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.delete(parent);

            chai.should();
            entry.state.should.equal(EntityState.Deleted);

            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE [entity0].[id] IN (@param0)",
                type: QueryType.DML,
                parameters: { param0: 1 }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should delete entity (hard delete)", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
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
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0] \nWHERE [entity0].[id] IN (@param0)",
                type: QueryType.DML,
                parameters: { param0: 1 }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should bulk delete with include (soft delete)", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const effected = await db.autoParents.include(o => o.details).delete(o => o.id === 1);

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1));\n\nDELETE [entity1]\nFROM [AutoDetail] AS [entity1] \nINNER JOIN [AutoParent] AS [entity0]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                type: QueryType.DML,
                parameters: {}
            } as IQuery);
            effected.should.be.greaterThan(0);
        });
        it("should bulk delete with include (hard delete)", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const effected = await db.autoParents.include(o => o.details)
                .where(o => o.id === 1)
                .delete("hard");

            chai.should();
            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0] \nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1));\n\nDELETE [entity1]\nFROM [AutoDetail] AS [entity1] \nINNER JOIN [AutoParent] AS [entity0]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))",
                type: QueryType.DML,
                parameters: {}
            } as IQuery);
            effected.should.be.greaterThan(0);
        });
        it("should fail soft delete for not supported entity", () => {
            const promise = db.autoParents.include(o => o.details)
                .where(o => o.id === 1)
                .delete("soft");

            promise.should.eventually.be.rejectedWith("'AutoDetail' did not support 'Soft' delete");
        });
        // it("should fail hard delete when relation still exist", () => {
        // });
        it("should cascade delete entity + relation (soft delete)", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "CASCADE";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE [entity0].[id] IN (@param0);\n\nDELETE [AutoDetail]\nFROM [AutoDetail] AS [AutoDetail] \nINNER JOIN (\n\tSELECT [entity0].[id],\n\t\t[entity0].[name],\n\t\t[entity0].[isDefault],\n\t\t[entity0].[isDeleted],\n\t\t[entity0].[createdDate],\n\t\t[entity0].[modifiedDate]\n\tFROM [AutoParent] AS [entity0]\n\tWHERE [entity0].[id] IN (@param0)\n) AS [entity0]\n\tON ([AutoDetail].[parentId]=[entity0].[id])",
                type: QueryType.DML,
                parameters: { param0: 1 }
            } as IQuery);

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should delete with SET NULL option (soft delete)", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "SET NULL";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE [entity0].[id] IN (@param0);\n\nUPDATE [AutoDetail]\nSET [AutoDetail].[parentId] = NULL\nFROM [AutoDetail] AS [AutoDetail] \nINNER JOIN (\n\tSELECT [entity0].[id],\n\t\t[entity0].[name],\n\t\t[entity0].[isDefault],\n\t\t[entity0].[isDeleted],\n\t\t[entity0].[createdDate],\n\t\t[entity0].[modifiedDate]\n\tFROM [AutoParent] AS [entity0]\n\tWHERE [entity0].[id] IN (@param0)\n) AS [entity0]\n\tON ([AutoDetail].[parentId]=[entity0].[id])",
                type: QueryType.DML,
                parameters: { param0: 1 }
            } as IQuery);

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should delete with SET DEFAULT option (soft delete)", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "SET DEFAULT";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0] \nWHERE [entity0].[id] IN (@param0);\n\nUPDATE [AutoDetail]\nSET [AutoDetail].[parentId] = 0\nFROM [AutoDetail] AS [AutoDetail] \nINNER JOIN (\n\tSELECT [entity0].[id],\n\t\t[entity0].[name],\n\t\t[entity0].[isDefault],\n\t\t[entity0].[isDeleted],\n\t\t[entity0].[createdDate],\n\t\t[entity0].[modifiedDate]\n\tFROM [AutoParent] AS [entity0]\n\tWHERE [entity0].[id] IN (@param0)\n) AS [entity0]\n\tON ([AutoDetail].[parentId]=[entity0].[id])",
                type: QueryType.DML,
                parameters: { param0: 1 }
            } as IQuery);

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
            spy.should.have.been.calledOnce.and.calledWithMatch(data, { type: "soft" } as IDeleteEventParam);
            spy2.should.have.been.calledOnce.and.calledWithMatch(data, { type: "soft" } as IDeleteEventParam);
            spy.should.be.calledBefore(spy2);
        });
    });
    describe("ADD RELATION", () => {
        it("should add one-one relation", () => {

        });
        it("should add one-many relation", async () => {
            const spy = sinon.spy(db.connection, "executeQuery");
            const parent = new AutoParent();
            parent.id = 1;
            db.attach(parent);
            
            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            chai.should();
            const effected = await db.saveChanges();

            spy.should.have.been.calledOnce.and.calledWithMatch({
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0] \nWHERE [entity0].[id] IN (@param0)",
                type: QueryType.DML,
                parameters: { param0: 1 }
            } as IQuery);
            effected.should.equal(1);
        });
        it("should add many-many relation", () => {

        });
        it("should add relation data", () => {

        });
        it("should update relation data", () => {

        });
    });
    describe("REMOVE RELATION", () => {
        it("should remove one-one/one-many relation by SET NULL", () => {

        });
        it("should remove one-one/one-many relation by SET DEFAULT", () => {

        });
        it("should remove one-one/one-many relation by DELETE", () => {

        });
        it("should remove many-many relation", () => {

        });
        it("should remove relation data", () => {

        });
    });
    describe("SAVE CHANGES", () => {
        it("should bulk insert/update/delete entity and relation", () => {

        });
        it("should failed without changing context state", () => {

        });
    });
});

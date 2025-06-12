import "../../../src/Startup";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { QueryType } from "../../../src/Common/Enum";
import { IConnection } from "../../../src/Connection/IConnection";
import { PooledConnection } from "../../../src/Connection/PooledConnection";
import { EntityState } from "../../../src/Data/EntityState";
import { Uuid } from "../../../src/Data/Uuid";
import { entityMetaKey, relationMetaKey } from "../../../src/Decorator/DecoratorKey";
import { IDeleteEventParam } from "../../../src/MetaData/Interface/IDeleteEventParam";
import { IEntityMetaData } from "../../../src/MetaData/Interface/IEntityMetaData";
import { ISaveEventParam } from "../../../src/MetaData/Interface/ISaveEventParam";
import { RelationMetaData } from "../../../src/MetaData/Relation/RelationMetaData";
import { MockConnection } from "../../Mock/MockConnection";
import { mockContext } from "../../Mock/MockContext";
import { IQuery } from "../../../src/Query/IQuery";
import { AutoDetail, AutoParent, Order, OrderDetail, Product } from "../../Common/Model";
import { AutoDetailDesc } from "../../Common/Model/AutoDetailDesc";
import { MyDb } from "../../Common/MyDb";

const db = new MyDb();
mockContext(db);
beforeEach(async () => {
    db.connection = await db.getConnection();
    db.connectionManager.getAllConnections = () => Promise.resolve([db.connection]);
});
afterEach(() => {
    db.clear();
    vi.restoreAllMocks();
    db.closeConnection();
});
const getConnection = (con: IConnection) => (con instanceof PooledConnection ? con.connection : con) as MockConnection;

describe("DATA MANIPULATION", () => {
    describe("INSERT", () => {
        it("should insert new entity 1", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const productId = Uuid.new();
            const effected = await db.products.insert({
                ProductId: productId,
                Price: 10000
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t('${productId.toString()}',10000)`,
                type: QueryType.DML,
                parameters: new Map()
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should insert new entity 2", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const product = new Product();
            product.ProductId = Uuid.new();
            product.Price = 10000;
            db.add(product);
            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t(@param0,@param1)`,
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", product.ProductId], ["param1", product.Price]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should insert new entity 3", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const product = db.products.new({
                ProductId: Uuid.new(),
                Price: 10000
            });
            const effected = await db.saveChanges();

            expect(effected).toBe(1);
            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: `INSERT INTO [Products]([ProductId], [Price]) VALUES\n\t(@param0,@param1)`,
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", product.ProductId], ["param1", product.Price]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should insert new entity and update all insert generated column (createdDate, default)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const data = db.autoParents.new({
                name: "Insert 1",
                createdDate: null,
                modifiedDate: null
            });
            const effected = await db.saveChanges();

            expect(effected).toBe(1);
            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "INSERT INTO [AutoParent]([name], [isDefault], [isDeleted]) OUTPUT INSERTED.[id] AS id, INSERTED.[isDefault] AS isDefault, INSERTED.[isDeleted] AS isDeleted, INSERTED.[createdDate] AS createdDate, INSERTED.[modifiedDate] AS modifiedDate VALUES\n\t(@param0,DEFAULT,DEFAULT)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", "Insert 1"]])
            } as IQuery));
            expect(data).toHaveProperty("isDeleted", false);
            expect(data).toHaveProperty("isDefault", true);
            expect(data).toHaveProperty("createdDate");
            expect(data.createdDate).toBeInstanceOf(Date);
            expect(data).toHaveProperty("modifiedDate");
            expect(data.modifiedDate).toBeInstanceOf(Date);
            expect(data).toHaveProperty("id");
            expect(typeof data.id).toBe("number");
            expect(data.id).toBeGreaterThan(0);
        });
        it("should insert entity with it relation correctly", async () => {
            const spy = vi.spyOn(db.connection, "query");

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
            expect(effected).toBe(5);
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({
                query: "INSERT INTO [AutoParent]([name], [isDefault], [isDeleted]) OUTPUT INSERTED.[id] AS id, INSERTED.[isDefault] AS isDefault, INSERTED.[isDeleted] AS isDeleted, INSERTED.[createdDate] AS createdDate, INSERTED.[modifiedDate] AS modifiedDate VALUES\n\t(@param0,DEFAULT,DEFAULT),\n\t(@param1,DEFAULT,DEFAULT)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", "Insert 1"], ["param1", "Insert 2"]])
            } as IQuery));
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({
                query: "INSERT INTO [AutoDetail]([parentId], [description]) OUTPUT INSERTED.[id] AS id, INSERTED.[parentId] AS parentId, INSERTED.[version] AS version VALUES\n\t(@param1,@param0),\n\t(@param1,@param2),\n\t(@param4,@param3)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", "detail 1"], ["param1", data.id], ["param2", "detail 2"], ["param3", "detail 21"], ["param4", data2.id]])
            } as IQuery));
            expect(data).toHaveProperty("isDeleted", false);
            expect(data).toHaveProperty("isDefault", true);
            expect(data).toHaveProperty("createdDate");
            expect(data.createdDate).toBeInstanceOf(Date);
            expect(data).toHaveProperty("modifiedDate");
            expect(data.modifiedDate).toBeInstanceOf(Date);
            expect(data).toHaveProperty("id");
            expect(typeof data.id).toBe("number");
            expect(data.id).toBeGreaterThan(0);

            expect(data).toHaveProperty("details");
            expect(Array.isArray(data.details)).toBe(true);
            expect(data.details).toHaveLength(2);
            for (const d of data.details) {
                expect(d).toHaveProperty("description");
                expect(typeof d.description).toBe("string");
                expect(d).toHaveProperty("id");
                expect(typeof d.id).toBe("number");
                expect(d.id).toBeGreaterThan(0);
                expect(d).toHaveProperty("parentId");
                expect(d.parentId).toBe(data.id);
                expect(d).toHaveProperty("parent");
                expect(d.parent).toBe(data);
            }
        });
        it("should trigger before/after save event", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = vi.spyOn(entityMetaData, "beforeSave");
            const spy2 = vi.spyOn(entityMetaData, "afterSave");

            const data = db.autoParents.new({
                name: "Insert 1",
                createdDate: null,
                modifiedDate: null
            });
            const effected = await db.saveChanges();

            expect(effected).toBe(1);
            expect(spy).toHaveBeenCalledExactlyOnceWith(data, { type: "insert" } as ISaveEventParam);
            expect(spy2).toHaveBeenCalledExactlyOnceWith(data, { type: "insert" } as ISaveEventParam);
            expect(spy).toHaveBeenCalledBefore(spy2);
        });
        it("should bulk insert", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const effected = await db.autoParents.where((o) => o.details.count() <= 0).select(AutoDetail, (o) => ({
                description: "Detail of parent " + o.id
            })).insertInto(AutoDetail);

            expect(spy).toHaveBeenCalledOnce();
            var param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("INSERT INTO [AutoDetail] ([description])\nSELECT ('Detail of parent '+CAST([entity0].[id] AS nvarchar(255))) AS [column1]\nFROM [AutoParent] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[parentId],\n\t\tCOUNT([entity1].[id]) AS [column0]\n\tFROM [AutoDetail] AS [entity1]\n\tGROUP BY [entity1].[parentId]\n) AS [entity1]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity1].[column0]<=0))");
            expect(param.type).toBe(QueryType.DML);
            expect(param.parameters).toEqual(new Map());
            expect(effected).toBeGreaterThan(0);
        });
    });
    describe("UPDATE", () => {
        it("should update entity 1", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            expect(entry.state).toBe(EntityState.Modified);

            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", 1], ["param1", "Updated"]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should bulk update entity", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const effected = await db.autoParents.where((o) => o.id === 1).update({
                name: "Updated",
                isDefault: (o) => !o.isDefault
            });

            expect(spy).toHaveBeenCalledOnce();
            var param = spy.mock.calls[0][0] as any as IQuery;
            expect(param.query).toBe("UPDATE [entity0]\nSET [entity0].[name] = 'Updated', [entity0].[isDefault] = (\n\tCASE WHEN (NOT(\n\t\t([entity0].[isDefault]=1)\n\t)) \n\tTHEN 1\n\tELSE 0\n\tEND\n), [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))");
            expect(param.type).toBe(QueryType.DML);
            expect(param.parameters).toEqual(new Map());
            expect(effected).toBe(1);
        });
        it("should update with DIRTY concurrency check", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "OPTIMISTIC DIRTY";

            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            expect(entry.state).toBe(EntityState.Modified);

            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[id]=@param0) AND ([entity0].[name]=@param2));\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", 1], ["param1", "Updated"], ["param2", "Original"]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should update with VERSION concurrency check", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const parent = new AutoDetail();
            parent.id = 1;
            parent.description = "Original";
            const oldVersion = parent.version = new Uint8Array([1, 200, 0, 0, 100]);
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.description = "Updated";

            expect(entry.state).toBe(EntityState.Modified);

            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[description] = @param1\nFROM [AutoDetail] AS [entity0]\nWHERE (([entity0].[id]=@param0) AND ([entity0].[version]=@param2));\n\nSELECT [entity0].[id],\n\t[entity0].[version]\nFROM [AutoDetail] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", 1], ["param1", "Updated"], ["param2", oldVersion]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should update with VERSION concurrency check (fallback to ModifiedDate)", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "OPTIMISTIC VERSION";

            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const oldModifiedDate = Date.utcTimestamp();
            parent.modifiedDate = oldModifiedDate;
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            expect(entry.state).toBe(EntityState.Modified);

            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[id]=@param0) AND ([entity0].[modifiedDate]=@param2));\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", 1], ["param1", "Updated"], ["param2", oldModifiedDate.toUTCDate()]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should update without concurrency check", async () => {
            const entityMeta = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData<AutoParent>;
            entityMeta.concurrencyMode = "NONE";

            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            expect(entry.state).toBe(EntityState.Modified);

            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", 1], ["param1", "Updated"]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should throw concurrency error", async () => {
            const parent = new AutoDetail();
            parent.id = 1;
            parent.description = "Original";
            parent.version = new Uint8Array([1, 200, 0, 0, 100]);
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.description = "Updated";

            const mockConnection = getConnection(db.connection);
            mockConnection.results = [{
                effectedRows: 0
            }];
            const promise = db.saveChanges();
            await expect(promise).rejects.toThrow("Concurrency Error");
        });
        it("should update ModifiedDate", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.entry(parent);
            entry.state = EntityState.Unchanged;
            parent.name = "Updated";

            await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", 1], ["param1", "Updated"]])
            } as IQuery));
        });
        it("should not update Readonly Column, ex: CreatedDate", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.attach(parent);
            parent.createdDate = new Date();
            parent.modifiedDate = new Date();

            expect(entry.state).toBe(EntityState.Unchanged);

            parent.name = "Updated";

            expect(entry.state).toBe(EntityState.Modified);

            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[name] = @param1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0);\n\nSELECT [entity0].[id],\n\t[entity0].[modifiedDate]\nFROM [AutoParent] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([["param0", 1], ["param1", "Updated"]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should trigger before/after save event", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = vi.spyOn(entityMetaData, "beforeSave");
            const spy2 = vi.spyOn(entityMetaData, "afterSave");

            const data = new AutoParent();
            data.id = 1;
            data.name = "Original";
            db.attach(data);
            data.name = "Updated";
            const effected = await db.saveChanges();

            expect(effected).toBe(1);
            expect(spy).toHaveBeenCalledExactlyOnceWith(data, { type: "update" } as ISaveEventParam);
            expect(spy2).toHaveBeenCalledExactlyOnceWith(data, { type: "update" } as ISaveEventParam);
            expect(spy).toHaveBeenCalledBefore(spy2);
        });
    });
    describe("DELETE", () => {
        it("should delete entity (soft delete) + should update modifiedDate", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.delete(parent);

            expect(entry.state).toBe(EntityState.Deleted);

            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE [entity0].[id] IN (@param0)",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 1]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should delete entity (hard delete)", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            parent.name = "Original";
            const entry = db.delete(parent);

            expect(entry.state).toBe(EntityState.Deleted);

            const effected = await db.saveChanges({
                forceHardDelete: true
            });

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "DELETE [entity0]\nFROM [AutoParent] AS [entity0]\nWHERE [entity0].[id] IN (@param0)",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 1]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should bulk delete with include (soft delete)", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const effected = await db.autoParents.include((o) => o.details).delete((o) => o.id === 1);

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1));\n\nDELETE [entity1]\nFROM [AutoDetail] AS [entity1]\nINNER JOIN [AutoParent] AS [entity0]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))");
            expect(param.type).toBe(QueryType.DML);
            expect(param.parameters).toEqual(new Map());
            expect(effected).toBeGreaterThan(0);
        });
        it("should bulk delete with include (hard delete)", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const effected = await db.autoParents.include((o) => o.details)
                .where((o) => o.id === 1)
                .delete("hard");

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("DELETE [entity0]\nFROM [AutoParent] AS [entity0]\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1));\n\nDELETE [entity1]\nFROM [AutoDetail] AS [entity1]\nINNER JOIN [AutoParent] AS [entity0]\n\tON ([entity0].[id]=[entity1].[parentId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity0].[id]=1))");
            expect(param.type).toBe(QueryType.DML);
            expect(param.parameters).toEqual(new Map());
            expect(effected).toBeGreaterThan(0);
        });
        it("should fail soft delete for not supported entity", async () => {
            const promise = db.autoParents.include((o) => o.details)
                .where((o) => o.id === 1)
                .delete("soft");

            await expect(promise).rejects.toThrow("'AutoDetail' did not support 'Soft' delete");
        });
        // it("should fail hard delete when relation still exist", async () => { });
        it("should cascade delete entity + relation (soft delete)", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "CASCADE";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE [entity0].[id] IN (@param0);\n\nDELETE [AutoDetail]\nFROM [AutoDetail] AS [AutoDetail]\nINNER JOIN (\n\tSELECT [entity0].[id],\n\t\t[entity0].[name],\n\t\t[entity0].[isDefault],\n\t\t[entity0].[isDeleted],\n\t\t[entity0].[createdDate],\n\t\t[entity0].[modifiedDate]\n\tFROM [AutoParent] AS [entity0]\n\tWHERE [entity0].[id] IN (@param0)\n) AS [entity0]\n\tON ([AutoDetail].[parentId]=[entity0].[id])",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 1]])
            } as IQuery));

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should delete with SET NULL option (soft delete)", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "SET NULL";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE [entity0].[id] IN (@param0);\n\nUPDATE [AutoDetail]\nSET [AutoDetail].[parentId] = NULL\nFROM [AutoDetail] AS [AutoDetail]\nINNER JOIN (\n\tSELECT [entity0].[id],\n\t\t[entity0].[name],\n\t\t[entity0].[isDefault],\n\t\t[entity0].[isDeleted],\n\t\t[entity0].[createdDate],\n\t\t[entity0].[modifiedDate]\n\tFROM [AutoParent] AS [entity0]\n\tWHERE [entity0].[id] IN (@param0)\n) AS [entity0]\n\tON ([AutoDetail].[parentId]=[entity0].[id])",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 1]])
            } as IQuery));

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should delete with SET DEFAULT option (soft delete)", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const relationMeta = Reflect.getOwnMetadata(relationMetaKey, AutoDetail, "parent") as RelationMetaData;
            relationMeta.deleteOption = "SET DEFAULT";

            const parent = new AutoParent();
            parent.id = 1;
            db.delete(parent);

            await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[isDeleted] = 1, [entity0].[modifiedDate] = getutcdate()\nFROM [AutoParent] AS [entity0]\nWHERE [entity0].[id] IN (@param0);\n\nUPDATE [AutoDetail]\nSET [AutoDetail].[parentId] = 0\nFROM [AutoDetail] AS [AutoDetail]\nINNER JOIN (\n\tSELECT [entity0].[id],\n\t\t[entity0].[name],\n\t\t[entity0].[isDefault],\n\t\t[entity0].[isDeleted],\n\t\t[entity0].[createdDate],\n\t\t[entity0].[modifiedDate]\n\tFROM [AutoParent] AS [entity0]\n\tWHERE [entity0].[id] IN (@param0)\n) AS [entity0]\n\tON ([AutoDetail].[parentId]=[entity0].[id])",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 1]])
            } as IQuery));

            relationMeta.deleteOption = "NO ACTION";
        });
        it("should trigger before/after delete event", async () => {
            const entityMetaData = Reflect.getOwnMetadata(entityMetaKey, AutoParent) as IEntityMetaData;
            const spy = vi.spyOn(entityMetaData, "beforeDelete");
            const spy2 = vi.spyOn(entityMetaData, "afterDelete");

            const data = new AutoParent();
            data.id = 1;
            db.delete(data);
            const effected = await db.saveChanges();

            expect(effected).toBe(1);
            expect(spy).toHaveBeenCalledExactlyOnceWith(data, { type: "soft" } as IDeleteEventParam);
            expect(spy2).toHaveBeenCalledExactlyOnceWith(data, { type: "soft" } as IDeleteEventParam);
            expect(spy).toHaveBeenCalledBefore(spy2);
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
            expect(db.relationEntries.add.size).toBe(1);
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
            expect(db.relationEntries.add.size).toBe(0);
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
            expect(db.relationEntries.delete.size).toBe(1);
        });
    });
    describe("ADD RELATION", () => {
        it("should add one-one relation", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            const detailDesc = new AutoDetailDesc();
            detailDesc.desc = "description";
            db.attach(detail);

            detail.autoDetailDesc = detailDesc;
            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[id] = @param0\nFROM [AutoDetailDesc] AS [entity0]\nWHERE ([entity0].[id]=@param0)",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 10]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        it("should add one-many relation", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const parent = new AutoParent();
            parent.id = 1;
            db.attach(parent);

            const detail = new AutoDetail();
            detail.id = 10;
            db.attach(detail);

            parent.details = [detail];
            const effected = await db.saveChanges();

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[parentId] = @param0\nFROM [AutoDetail] AS [entity0]\nWHERE ([entity0].[id]=@param1)",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 1], ["param1", 10]])
            } as IQuery));
            expect(effected).toBe(1);
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
            const spy = vi.spyOn(db.connection, "query");
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

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "DELETE [entity0]\nFROM [AutoDetailDesc] AS [entity0]\nWHERE [entity0].[id] IN (@param0);\n\nDELETE [entity0]\nFROM [AutoDetail] AS [entity0]\nWHERE [entity0].[id] IN (@param0)",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 10]])
            } as IQuery));
            expect(effected).toBe(2);
        });
        it("should remove one-one/one-many relation by SET NULL", async () => {
            const spy = vi.spyOn(db.connection, "query");
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

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "UPDATE [entity0]\nSET [entity0].[parentId] = NULL\nFROM [AutoDetail] AS [entity0]\nWHERE [entity0].[id] IN (@param0)",
                type: QueryType.DML,
                parameters: new Map<string, any>([["param0", 10]])
            } as IQuery));
            expect(effected).toBe(1);
        });
        // it("should remove many-many relation", () => {
        // });
        // it("should remove relation data", () => {
        // });
    });
    describe("SAVE CHANGES", () => {
        it("should bulk insert/update/delete entity and relation", async () => {
            const spy = vi.spyOn(db.connection, "query");
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

            expect(spy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
                query: "INSERT INTO [OrderDetails]([OrderDetailId], [OrderId], [ProductId], [ProductName], [Quantity], [CreatedDate], [isDeleted]) OUTPUT INSERTED.[isDeleted] AS isDeleted VALUES\n\t(@param0,@param1,DEFAULT,@param2,@param3,DEFAULT,DEFAULT);\n\nUPDATE [entity1]\nSET [entity1].[TotalAmount] = @param4\nFROM [Orders] AS [entity1]\nWHERE ([entity1].[OrderId]=@param1);\n\nUPDATE [entity2]\nSET [entity2].[OrderId] = @param1\nFROM [OrderDetails] AS [entity2]\nWHERE ([entity2].[OrderDetailId]=@param5);\n\nUPDATE [entity0]\nSET [entity0].[OrderId] = NULL\nFROM [OrderDetails] AS [entity0]\nWHERE [entity0].[OrderDetailId] IN (@param6);\n\nUPDATE [entity3]\nSET [entity3].[isDeleted] = 1\nFROM [OrderDetails] AS [entity3]\nWHERE [entity3].[OrderDetailId] IN (@param7)",
                type: QueryType.DML | QueryType.DQL,
                parameters: new Map<string, any>([
                    ["param0", newOd.OrderDetailId],
                    ["param1", newOd.OrderId],
                    ["param2", newOd.name],
                    ["param3", newOd.quantity],
                    ["param4", order.TotalAmount],
                    ["param5", orderDetail3.OrderDetailId],
                    ["param6", orderDetail2.OrderDetailId],
                    ["param7", orderDetail.OrderDetailId]
                ])
            } as IQuery));
            expect(effected).toBe(5);
        });
        // it("should failed without changing context state", async () => {});
    });
});

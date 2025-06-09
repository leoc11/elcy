import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryType } from "../../../src/Common/Enum";
import { Uuid } from "../../../src/Data/Uuid";
import { entityMetaKey } from "../../../src/Decorator/DecoratorKey";
import { IEntityMetaData } from "../../../src/MetaData/Interface/IEntityMetaData";
import { mockContext } from "../../../src/Mock/MockContext";
import { IQuery } from "../../../src/Query/IQuery";
import { Collection, Order, OrderDetail, OrderDetailProperty, Product } from "../../Common/Model";
import { MyDb } from "../../Common/MyDb";
import { Enumerable } from "../../../src/Enumerable/Enumerable";
// import { MssqlDriver } from "elcy-tedious/MssqlDriver";

const orderDetailMeta = Reflect.getOwnMetadata(entityMetaKey, OrderDetail) as IEntityMetaData;
const orderMeta = Reflect.getOwnMetadata(entityMetaKey, Order) as IEntityMetaData;

const db = new MyDb(
    // () => new MssqlDriver({
    //     server: "localhost",
    //     userName: "sa",
    //     password: "password",
    //     options: {
    //         database: "Database",
    //         instanceName: "SQLEXPRESS",
    //         port: 1433
    //     }
    // })
);
mockContext(db);
beforeEach(async () => {
    db.connection = await db.getConnection();
});
afterEach(() => {
    db.clear();
    vi.restoreAllMocks();
    db.closeConnection();
});
describe("QUERYABLE", async () => {
    describe("INCLUDE", async () => {
        it("should eager load list navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const include = db.orders.include((o) => o.OrderDetails);
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results.length).toBeGreaterThan(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
                const properties = orderMeta.columns.select((o) => o.propertyName).toArray();
                for (const property of properties) {
                    expect(o).toHaveProperty(property as any);
                    expect(o[property]).not.toBeNull();
                }
                expect(o.OrderDetails).toBeInstanceOf(Array);
                for (const od of o.OrderDetails) {
                    expect(od).toBeInstanceOf(OrderDetail);
                    const odProps = orderDetailMeta.columns.select((o) => o.propertyName).toArray();
                    for (const prop of odProps) {
                        expect(od).toHaveProperty(prop as any);
                        expect(od[prop]).not.toBeNull();
                    }
                }
            }
        });
        it("should support nested include", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const include = db.orders.include((o) => o.OrderDetails.include((od) => od.Product));
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1] ON ([entity1].[ProductId]=[entity2].[ProductId]);\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[ProductId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
                expect(o.OrderDetails).toBeInstanceOf(Array);
                for (const od of o.OrderDetails) {
                    expect(od).toBeInstanceOf(OrderDetail);
                    expect(od.Product).toBeInstanceOf(Product);
                }
            }
        });
        it("should eager load scalar navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const include = db.orderDetails.include((o) => o.Order);
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailId],\n\t\t[entity0].[OrderId],\n\t\t[entity0].[ProductId],\n\t\t[entity0].[ProductName],\n\t\t[entity0].[Quantity],\n\t\t[entity0].[CreatedDate],\n\t\t[entity0].[isDeleted]\n\tFROM [OrderDetails] AS [entity0]\n\tWHERE ([entity0].[isDeleted]=0)\n) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId]);\n\nSELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
                expect(o.Order).toBeInstanceOf(Order);
            }
        });
        it("should eager load 2 navigation properties at once", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const include = db.orderDetails.include((o) => o.Order, (o) => o.Product);
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailId],\n\t\t[entity0].[OrderId],\n\t\t[entity0].[ProductId],\n\t\t[entity0].[ProductName],\n\t\t[entity0].[Quantity],\n\t\t[entity0].[CreatedDate],\n\t\t[entity0].[isDeleted]\n\tFROM [OrderDetails] AS [entity0]\n\tWHERE ([entity0].[isDeleted]=0)\n) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId]);\n\nSELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailId],\n\t\t[entity0].[OrderId],\n\t\t[entity0].[ProductId],\n\t\t[entity0].[ProductName],\n\t\t[entity0].[Quantity],\n\t\t[entity0].[CreatedDate],\n\t\t[entity0].[isDeleted]\n\tFROM [OrderDetails] AS [entity0]\n\tWHERE ([entity0].[isDeleted]=0)\n) AS [entity0] ON ([entity0].[ProductId]=[entity2].[ProductId]);\n\nSELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
                expect(o.Order).toBeInstanceOf(Order);
                expect(o.Product).toBeInstanceOf(Product);
            }
        });
        it("should load many-many relation", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const include = db.collections.include((o) => o.Products);
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[ProductId],\n\t[entity1].[Price]\nFROM [Products] AS [entity1]\nINNER JOIN (\n\tSELECT [CollectionProducts].[CollectionId],\n\t\t[CollectionProducts].[ProductId]\n\tFROM [CollectionProducts] AS [CollectionProducts]\n\tINNER JOIN [Collections] AS [entity0] ON ([entity0].[CollectionId]=[CollectionProducts].[CollectionId])\n) AS [CollectionProducts] ON ([CollectionProducts].[ProductId]=[entity1].[ProductId]);\n\nSELECT [CollectionProducts].[CollectionId],\n\t[CollectionProducts].[ProductId]\nFROM [CollectionProducts] AS [CollectionProducts]\nINNER JOIN [Collections] AS [entity0] ON ([entity0].[CollectionId]=[CollectionProducts].[CollectionId]);\n\nSELECT [entity0].[CollectionId],\n\t[entity0].[name]\nFROM [Collections] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Collection);
                expect(o.Products).toBeInstanceOf(Array);
                for (const p of o.Products) {
                    expect(p).toBeInstanceOf(Product);
                }
            }
        });
    });
    describe("PROJECT", async () => {
        it("should project specific property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const projection = db.orders.project((o) => o.TotalAmount);
            const results = await projection.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.TotalAmount).not.toBeUndefined();
                expect(o.OrderDate).toBeUndefined();
            }
        });
    });
    describe("SELECT", async () => {
        it("should return specific property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => o.OrderDate);
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Date);
            }
        });
        it("should return an object", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => ({
                date: o.OrderDate,
                amount: o.TotalAmount + 1.2
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[OrderDate] AS [column0],\n\t([entity0].[TotalAmount]+1.2) AS [column1]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.date).toBeInstanceOf(Date);
                expect(typeof o.amount).toBe("number");
            }
        });
        it("should return a value from scalar navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orderDetails.select((o) => ({
                date: o.Order.OrderDate
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity1].[OrderDate] AS [column0]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Orders] AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity0].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.date).toBeInstanceOf(Date);
            }
        });
        it("should return an object with list navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => ({
                ods: o.OrderDetails
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.ods).toBeInstanceOf(Array);
                for (const od of o.ods) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("should return an object with scalar navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orderDetails.select((o) => ({
                prod: o.Product
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[ProductId],\n\t[entity1].[Price]\nFROM [Products] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailId],\n\t\t[entity0].[ProductId]\n\tFROM [OrderDetails] AS [entity0]\n\tWHERE ([entity0].[isDeleted]=0)\n) AS [entity0] ON ([entity0].[ProductId]=[entity1].[ProductId]);\n\nSELECT [entity0].[OrderDetailId],\n\t[entity0].[ProductId]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.prod).toBeInstanceOf(Product);
            }
        });
        it("should return an value from list navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => ({
                simpleOrderDetails: o.OrderDetails.select((od) => ({
                    name: od.name
                })).toArray()
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductName] AS [column0]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.simpleOrderDetails).toBeInstanceOf(Array);
                expect(o.simpleOrderDetails.length).toBeGreaterThan(0);
                for (const od of o.simpleOrderDetails) {
                    expect(typeof od.name).toBe("string");
                }
            }
        });
        it("should return a scalar navigation property of list navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => ({
                simpleOrderDetails: o.OrderDetails.select((od) => ({
                    prod: od.Product
                })).toArray()
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[OrderId]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1] ON ([entity1].[ProductId]=[entity2].[ProductId]);\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[ProductId],\n\t[entity1].[OrderId]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.simpleOrderDetails).toBeInstanceOf(Array);
                expect(o.simpleOrderDetails.length).toBeGreaterThan(0);
                for (const od of o.simpleOrderDetails) {
                    expect(od.prod).toBeInstanceOf(Product);
                }
            }
        });
        it("should support self select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => ({
                simpleOrderDetails: o.OrderDetails.select((od) => ({
                    od: od,
                    Price: od.Product.Price
                })).toArray()
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderDetailId],\n\t[entity2].[OrderId],\n\t[entity2].[ProductId],\n\t[entity2].[ProductName],\n\t[entity2].[Quantity],\n\t[entity2].[CreatedDate],\n\t[entity2].[isDeleted]\nFROM [OrderDetails] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity3].[Price] AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tLEFT JOIN [Products] AS [entity3]\n\t\tON ([entity1].[ProductId]=[entity3].[ProductId])\n\tINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1] ON ([entity2].[OrderDetailId]=[entity1].[OrderDetailId])\nWHERE ([entity2].[isDeleted]=0);\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity3].[Price] AS [column0]\nFROM [OrderDetails] AS [entity1]\nLEFT JOIN [Products] AS [entity3]\n\tON ([entity1].[ProductId]=[entity3].[ProductId])\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.simpleOrderDetails).toBeInstanceOf(Array);
                expect(o.simpleOrderDetails.length).toBeGreaterThan(0);
                for (const od of o.simpleOrderDetails) {
                    expect(od.od).toBeInstanceOf(OrderDetail);
                    expect(typeof od.Price).toBe("number");
                }
            }
        });
        it("should select array", async () => {
            // TODO: could be improve with groupBy
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => o.OrderDetails);
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Array);
                expect(o.length).not.toBe(0);
                for (const od of o) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("should select array with where in property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.select((o) => ({
                sum: o.OrderDetails.where((p) => p.quantity > 2).sum((o) => o.quantity),
                ods: o.OrderDetails.where((p) => p.quantity <= 1)
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderDetailId],\n\t[entity2].[OrderId],\n\t[entity2].[ProductId],\n\t[entity2].[ProductName],\n\t[entity2].[Quantity],\n\t[entity2].[CreatedDate],\n\t[entity2].[isDeleted]\nFROM [OrderDetails] AS [entity2]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity1].[column0] AS [column1]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[OrderId],\n\t\t\tSUM([entity1].[Quantity]) AS [column0]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>2))\n\t\tGROUP BY [entity1].[OrderId]\n\t) AS [entity1]\n\t\tON ([entity0].[OrderId]=[entity1].[OrderId])\n) AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId])\nWHERE (([entity2].[isDeleted]=0) AND ([entity2].[Quantity]<=1));\n\nSELECT [entity0].[OrderId],\n\t[entity1].[column0] AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tSUM([entity1].[Quantity]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>2))\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.sum).toBe("number");
                expect(o.ods).toBeInstanceOf(Array);
                for (const od of o.ods) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }

            const isAllEmpty = results.all((o) => !o.ods.any());
            expect(isAllEmpty).not.true;
        });
        it("should work in chain", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orderDetails.select((o) => ({
                test: o.Order.TotalAmount
            })).select((o) => ({
                test3: o.test
            })).where((o) => o.test3 > 10000);
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity1].[TotalAmount] AS [column0]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Orders] AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE (([entity0].[isDeleted]=0) AND ([entity1].[TotalAmount]>10000))");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.test3).toBe("number");
            }
        });
    });
    describe("SELECT MANY", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.selectMany((o) => o.OrderDetails);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("select many with nested select to entity", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.selectMany((o) => o.OrderDetails.select((o) => o.Product));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nINNER JOIN [Orders] AS [entity0]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Product);
            }
        });
        it("select many with nested select to related entity property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.selectMany((o) => o.OrderDetails.select((o) => o.Product.Price));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nINNER JOIN [Orders] AS [entity0]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("select many with nested select to many relation", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.where((o) => o.TotalAmount > 10000).selectMany((o) => o.OrderDetails.select((o) => o.OrderDetailProperties));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderDetailPropertyId],\n\t[entity2].[OrderDetailId],\n\t[entity2].[Name],\n\t[entity2].[Amount]\nFROM [OrderDetailProperties] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity0].[TotalAmount],\n\t\t[entity0].[OrderDate]\n\tFROM [Orders] AS [entity0]\n\tWHERE ([entity0].[TotalAmount]>10000)\n) AS [entity0]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Array);
            }

            const isAllEmpty = results.all((o) => !o.any());
            expect(isAllEmpty).toBe(false);
        });
        it("should worked in chain", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.selectMany((o) => o.OrderDetails).selectMany((o) => o.OrderDetailProperties);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderDetailPropertyId],\n\t[entity2].[OrderDetailId],\n\t[entity2].[Name],\n\t[entity2].[Amount]\nFROM [OrderDetailProperties] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Orders] AS [entity0]\n\t\tON ([entity0].[OrderId]=[entity1].[OrderId])\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetailProperty);
            }
        });
        it("nested selectMany", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.selectMany((o) => o.OrderDetails.selectMany((o) => o.OrderDetailProperties));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderDetailPropertyId],\n\t[entity2].[OrderDetailId],\n\t[entity2].[Name],\n\t[entity2].[Amount]\nFROM [OrderDetailProperties] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])\nINNER JOIN [Orders] AS [entity0]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetailProperty);
            }
        });
    });
    describe("WHERE", async () => {
        it("should add where clause", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const where = db.orders.where((o) => o.TotalAmount <= 10000);
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[TotalAmount]<=10000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
                expect(o.TotalAmount).toBeLessThanOrEqual(10000);
            }
        });
        it("should filter included list", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const where = db.orders.include((o) => o.OrderDetails.where((od) => od.Product.Price <= 15000));
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE (([entity1].[isDeleted]=0) AND ([entity2].[Price]<=15000));\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
                expect(o.OrderDetails).toBeInstanceOf(Array);
                for (const od of o.OrderDetails) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("should be supported in select statement", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const where = db.orders.select((o) => ({
                ods: o.OrderDetails.where((od) => od.Product.Price <= 15000)
            }));
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE (([entity1].[isDeleted]=0) AND ([entity2].[Price]<=15000));\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o.ods).toBeInstanceOf(Array);
                for (const od of o.ods) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("could be used more than once in chain", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const where = db.orderDetails.where((o) => o.Product.Price <= 15000).where((o) => o.name.like("%a%"));
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON ([entity0].[ProductId]=[entity1].[ProductId])\nWHERE ((([entity0].[isDeleted]=0) AND ([entity1].[Price]<=15000)) AND ([entity0].[ProductName] LIKE '%a%'))");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("should work with groupBy", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const where = db.orders.where((o) => o.TotalAmount > 20000).groupBy((o) => o.OrderDate)
                .where((o) => o.count() >= 1)
                .select((o) => o.key).where((o) => o.getDate() > 15).orderBy([(o) => o]);
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[TotalAmount]>20000)\nGROUP BY [entity0].[OrderDate]\nHAVING ((COUNT([entity0].[OrderId])>=1) AND (DAY([entity0].[OrderDate])>15))\nORDER BY [entity0].[OrderDate] ASC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Date);
            }
        });
        it("should filter with navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const where = db.orderDetailProperties.where((o) => o.OrderDetail.Order.TotalAmount > 10000);
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailPropertyId],\n\t[entity0].[OrderDetailId],\n\t[entity0].[Name],\n\t[entity0].[Amount]\nFROM [OrderDetailProperties] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\nLEFT JOIN [Orders] AS [entity2]\n\tON ([entity1].[OrderId]=[entity2].[OrderId])\nWHERE ([entity2].[TotalAmount]>10000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetailProperty);
            }
        });
    });
    describe("ORDER BY", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.orderBy([(o) => o.TotalAmount, "DESC"]);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nORDER BY [entity0].[TotalAmount] DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("by related entity", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orderDetails.orderBy([(o) => o.Product.Price, "DESC"]);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON ([entity0].[ProductId]=[entity1].[ProductId])\nWHERE ([entity0].[isDeleted]=0)\nORDER BY [entity1].[Price] DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("by computed column", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orderDetails.orderBy([(o) => o.quantity * o.Product.Price, "DESC"]);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON ([entity0].[ProductId]=[entity1].[ProductId])\nWHERE ([entity0].[isDeleted]=0)\nORDER BY ([entity0].[Quantity]*[entity1].[Price]) DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("should be ordered by multiple column", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orderDetails.orderBy([(o) => o.quantity], [(o) => o.Product.Price, "DESC"]);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON ([entity0].[ProductId]=[entity1].[ProductId])\nWHERE ([entity0].[isDeleted]=0)\nORDER BY [entity0].[Quantity] ASC, [entity1].[Price] DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("should used last defined order", async () => {
            const spy = vi.spyOn(db.connection, "query");

            // Note: thought Product no longer used, it still exist in join statement.
            const order = db.orderDetails.orderBy([(o) => o.Product.Price, "DESC"]).orderBy([(o) => o.quantity]);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON ([entity0].[ProductId]=[entity1].[ProductId])\nWHERE ([entity0].[isDeleted]=0)\nORDER BY [entity0].[Quantity] ASC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("could be used in include", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.include((o) => o.OrderDetails.orderBy([(od) => od.Product.Price, "DESC"]));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0)\nORDER BY [entity2].[Price] DESC;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
                expect(o.OrderDetails).toBeInstanceOf(Array);
                expect(o.OrderDetails.length).toBeGreaterThan(0);
                for (const od of o.OrderDetails) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.select((o) => ({
                ods: o.OrderDetails.orderBy([(o) => o.quantity]).toArray()
            }));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0)\nORDER BY [entity1].[Quantity] ASC;\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o.ods).toBeInstanceOf(Array);
                expect(o.ods.length).toBeGreaterThan(0);
                for (const od of o.ods) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
    });
    describe("ANY", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.any();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT TOP 1 1 AS [column0]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBe(true);
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const any = db.orders.select((o) => ({
                order: o,
                hasDetail: o.OrderDetails.any((od) => od.Product.Price < 20000)
            }));
            const results = await any.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t(\n\t\tCASE WHEN (([entity2].[column0] IS NOT NULL)) \n\t\tTHEN 1\n\t\tELSE 0\n\t\tEND\n\t) AS [column1]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\t1 AS [column0]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tLEFT JOIN [Products] AS [entity3]\n\t\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\t\tWHERE (([entity2].[isDeleted]=0) AND ([entity3].[Price]<20000))\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity2]\n\t\tON ([entity0].[OrderId]=[entity2].[OrderId])\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t(\n\tCASE WHEN (([entity2].[column0] IS NOT NULL)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\t1 AS [column0]\n\tFROM [OrderDetails] AS [entity2]\n\tLEFT JOIN [Products] AS [entity3]\n\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\tWHERE (([entity2].[isDeleted]=0) AND ([entity3].[Price]<20000))\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(typeof o.hasDetail).toBe("boolean");
            }
        });
        it("could be used in where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const any = db.orders.where((o) => o.OrderDetails.any());
            const results = await any.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\t1 AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[column0] IS NOT NULL)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("ALL", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.all((o) => o.TotalAmount <= 20000);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT TOP 1 0 AS [column0]\nFROM [Orders] AS [entity0]\nWHERE NOT(\n\t([entity0].[TotalAmount]<=20000)\n)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBe(false);
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const all = db.orders.select((o) => ({
                order: o,
                hasDetail: o.OrderDetails.all((od) => od.Product.Price < 20000)
            }));
            const results = await all.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t(\n\t\tCASE WHEN (([entity2].[column0] IS NULL)) \n\t\tTHEN 1\n\t\tELSE 0\n\t\tEND\n\t) AS [column1]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\t0 AS [column0]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tLEFT JOIN [Products] AS [entity3]\n\t\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\t\tWHERE (([entity2].[isDeleted]=0) AND NOT(\n\t\t\t([entity3].[Price]<20000)\n\t\t))\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity2]\n\t\tON ([entity0].[OrderId]=[entity2].[OrderId])\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t(\n\tCASE WHEN (([entity2].[column0] IS NULL)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\t0 AS [column0]\n\tFROM [OrderDetails] AS [entity2]\n\tLEFT JOIN [Products] AS [entity3]\n\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\tWHERE (([entity2].[isDeleted]=0) AND NOT(\n\t\t([entity3].[Price]<20000)\n\t))\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(typeof o.hasDetail).toBe("boolean");
            }
        });
        it("could be used in where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const all = db.orders.where((o) => o.OrderDetails.all((od) => od.Product.Price <= 20000));
            const results = await all.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\t0 AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tLEFT JOIN [Products] AS [entity2]\n\t\tON ([entity1].[ProductId]=[entity2].[ProductId])\n\tWHERE (([entity1].[isDeleted]=0) AND NOT(\n\t\t([entity2].[Price]<=20000)\n\t))\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[column0] IS NULL)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("MAX", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.max((o) => o.TotalAmount);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT MAX([entity0].[TotalAmount]) AS [column0]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());
            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const max = db.orders.select((o) => ({
                order: o,
                maxProductPrice: o.OrderDetails.max((od) => od.Product.Price)
            }));
            const results = await max.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity3].[column0] AS [column1]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\tMAX([entity3].[Price]) AS [column0]\n\t\tFROM [Products] AS [entity3]\n\t\tINNER JOIN (\n\t\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t\t[entity2].[ProductId],\n\t\t\t\t[entity2].[OrderId],\n\t\t\t\t[entity2].[ProductName],\n\t\t\t\t[entity2].[Quantity],\n\t\t\t\t[entity2].[CreatedDate],\n\t\t\t\t[entity2].[isDeleted]\n\t\t\tFROM [OrderDetails] AS [entity2]\n\t\t\tWHERE ([entity2].[isDeleted]=0)\n\t\t) AS [entity2]\n\t\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity3]\n\t\tON ([entity0].[OrderId]=[entity3].[OrderId])\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t[entity3].[column0] AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tMAX([entity3].[Price]) AS [column0]\n\tFROM [Products] AS [entity3]\n\tINNER JOIN (\n\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t[entity2].[ProductId],\n\t\t\t[entity2].[OrderId],\n\t\t\t[entity2].[ProductName],\n\t\t\t[entity2].[Quantity],\n\t\t\t[entity2].[CreatedDate],\n\t\t\t[entity2].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tWHERE ([entity2].[isDeleted]=0)\n\t) AS [entity2]\n\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity3]\n\tON ([entity0].[OrderId]=[entity3].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(typeof o.maxProductPrice).toBe("number");
            }
        });
        it("could be used in where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const max = db.orders.where((o) => o.OrderDetails.max((od) => od.Product.Price) > 20000);
            const results = await max.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMAX([entity2].[Price]) AS [column0]\n\tFROM [Products] AS [entity2]\n\tINNER JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE ([entity1].[isDeleted]=0)\n\t) AS [entity1]\n\t\tON ([entity1].[ProductId]=[entity2].[ProductId])\n\tGROUP BY [entity1].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nWHERE ([entity2].[column0]>20000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("MIN", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.min((o) => o.TotalAmount);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT MIN([entity0].[TotalAmount]) AS [column0]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const min = db.orders.select((o) => ({
                order: o,
                minProductPrice: o.OrderDetails.min((od) => od.Product.Price)
            }));
            const results = await min.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity3].[column0] AS [column1]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\tMIN([entity3].[Price]) AS [column0]\n\t\tFROM [Products] AS [entity3]\n\t\tINNER JOIN (\n\t\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t\t[entity2].[ProductId],\n\t\t\t\t[entity2].[OrderId],\n\t\t\t\t[entity2].[ProductName],\n\t\t\t\t[entity2].[Quantity],\n\t\t\t\t[entity2].[CreatedDate],\n\t\t\t\t[entity2].[isDeleted]\n\t\t\tFROM [OrderDetails] AS [entity2]\n\t\t\tWHERE ([entity2].[isDeleted]=0)\n\t\t) AS [entity2]\n\t\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity3]\n\t\tON ([entity0].[OrderId]=[entity3].[OrderId])\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t[entity3].[column0] AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tMIN([entity3].[Price]) AS [column0]\n\tFROM [Products] AS [entity3]\n\tINNER JOIN (\n\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t[entity2].[ProductId],\n\t\t\t[entity2].[OrderId],\n\t\t\t[entity2].[ProductName],\n\t\t\t[entity2].[Quantity],\n\t\t\t[entity2].[CreatedDate],\n\t\t\t[entity2].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tWHERE ([entity2].[isDeleted]=0)\n\t) AS [entity2]\n\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity3]\n\tON ([entity0].[OrderId]=[entity3].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(typeof o.minProductPrice).toBe("number");
            }
        });
        it("could be used in where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const min = db.orders.where((o) => o.OrderDetails.min((od) => od.Product.Price) > 20000);
            const results = await min.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMIN([entity2].[Price]) AS [column0]\n\tFROM [Products] AS [entity2]\n\tINNER JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE ([entity1].[isDeleted]=0)\n\t) AS [entity1]\n\t\tON ([entity1].[ProductId]=[entity2].[ProductId])\n\tGROUP BY [entity1].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nWHERE ([entity2].[column0]>20000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("AVG", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.avg((o) => o.TotalAmount);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT AVG([entity0].[TotalAmount]) AS [column0]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const avg = db.orders.select((o) => ({
                order: o,
                avgProductPrice: o.OrderDetails.avg((od) => od.Product.Price)
            }));
            const results = await avg.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity3].[column0] AS [column1]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\tAVG([entity3].[Price]) AS [column0]\n\t\tFROM [Products] AS [entity3]\n\t\tINNER JOIN (\n\t\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t\t[entity2].[ProductId],\n\t\t\t\t[entity2].[OrderId],\n\t\t\t\t[entity2].[ProductName],\n\t\t\t\t[entity2].[Quantity],\n\t\t\t\t[entity2].[CreatedDate],\n\t\t\t\t[entity2].[isDeleted]\n\t\t\tFROM [OrderDetails] AS [entity2]\n\t\t\tWHERE ([entity2].[isDeleted]=0)\n\t\t) AS [entity2]\n\t\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity3]\n\t\tON ([entity0].[OrderId]=[entity3].[OrderId])\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t[entity3].[column0] AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tAVG([entity3].[Price]) AS [column0]\n\tFROM [Products] AS [entity3]\n\tINNER JOIN (\n\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t[entity2].[ProductId],\n\t\t\t[entity2].[OrderId],\n\t\t\t[entity2].[ProductName],\n\t\t\t[entity2].[Quantity],\n\t\t\t[entity2].[CreatedDate],\n\t\t\t[entity2].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tWHERE ([entity2].[isDeleted]=0)\n\t) AS [entity2]\n\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity3]\n\tON ([entity0].[OrderId]=[entity3].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(o.avgProductPrice).which.is.an("number");
            }
        });
        it("could be used in where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const avg = db.orders.where((o) => o.OrderDetails.avg((od) => od.Product.Price) > 20000);
            const results = await avg.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tAVG([entity2].[Price]) AS [column0]\n\tFROM [Products] AS [entity2]\n\tINNER JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE ([entity1].[isDeleted]=0)\n\t) AS [entity1]\n\t\tON ([entity1].[ProductId]=[entity2].[ProductId])\n\tGROUP BY [entity1].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nWHERE ([entity2].[column0]>20000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("SUM", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.sum((o) => o.TotalAmount);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT SUM([entity0].[TotalAmount]) AS [column0]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const sum = db.orders.select((o) => ({
                order: o,
                sumProductPrice: o.OrderDetails.sum((od) => od.Product.Price * od.quantity)
            }));
            const results = await sum.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity2].[column1] AS [column2]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\tSUM(([entity3].[Price]*[entity2].[Quantity])) AS [column1]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tLEFT JOIN [Products] AS [entity3]\n\t\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\t\tWHERE ([entity2].[isDeleted]=0)\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity2]\n\t\tON ([entity0].[OrderId]=[entity2].[OrderId])\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t[entity2].[column1] AS [column2]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tSUM(([entity3].[Price]*[entity2].[Quantity])) AS [column1]\n\tFROM [OrderDetails] AS [entity2]\n\tLEFT JOIN [Products] AS [entity3]\n\t\tON ([entity2].[ProductId]=[entity3].[ProductId])\n\tWHERE ([entity2].[isDeleted]=0)\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(o.sumProductPrice).which.is.an("number");
            }
        });
        it("could be used in where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const sum = db.orders.where((o) => o.OrderDetails.sum((od) => od.quantity) > 3);
            const results = await sum.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tSUM([entity1].[Quantity]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[column0]>3)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("COUNT", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const count = db.orders.where((o) => o.OrderDetails.sum((od) => od.quantity) > 3);
            const result = await count.count();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT COUNT([entity0].[OrderId]) AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tSUM([entity1].[Quantity]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[column0]>3)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const count = db.orders.select((o) => ({
                order: o,
                countDetails: o.OrderDetails.count()
            }));
            const results = await count.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity2].[column0] AS [column1]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\tCOUNT([entity2].[OrderDetailId]) AS [column0]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tWHERE ([entity2].[isDeleted]=0)\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity2]\n\t\tON ([entity0].[OrderId]=[entity2].[OrderId])\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t[entity2].[column0] AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tCOUNT([entity2].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[isDeleted]=0)\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o.order).which.is.an.instanceof(Order);
                expect(o.countDetails).which.is.an("number");
            }
        });
        it("could be used in where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const count = db.orders.where((o) => o.OrderDetails.count() > 3);
            const results = await count.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity1].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[column0]>3)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("could be used in select with different filter", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const count = db.orders.groupBy((o) => ({ month: o.OrderDate.getMonth() })).select((o) => ({
                qty: o.selectMany((o) => o.OrderDetails).select((o) => o.quantity).sum(),
                bc: o.where((o) => o.TotalAmount > 20000).count(),
                cd: o.where((o) => o.TotalAmount <= 20000).count()
            }));
            const results = await count.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT SUM([entity1].[Quantity]) AS [column1],\n\tCOUNT([entity2].[OrderId]) AS [column2],\n\tCOUNT([entity3].[OrderId]) AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[Quantity]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN (\n\tSELECT [entity2].[OrderId]\n\tFROM [Orders] AS [entity2]\n\tWHERE ([entity2].[TotalAmount]>20000)\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nLEFT JOIN (\n\tSELECT [entity3].[OrderId]\n\tFROM [Orders] AS [entity3]\n\tWHERE ([entity3].[TotalAmount]<=20000)\n) AS [entity3]\n\tON ([entity0].[OrderId]=[entity3].[OrderId])\nGROUP BY (MONTH([entity0].[OrderDate]) - 1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(typeof o.qty).toBe("number");
                expect(typeof o.bc).toBe("number");
                expect(typeof o.cd).toBe("number");
            }
        });
    });
    describe("TAKE SKIP", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const take = db.orders.take(10).skip(4).take(2).skip(1);
            const results = await take.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nORDER BY (SELECT NULL)\nOFFSET 5 ROWS\nFETCH NEXT 1 ROWS ONLY");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBe(1);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("order.take.order.take", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const take = db.orders.orderBy([(o) => o.OrderDate, "DESC"]).take(10)
                .orderBy([(o) => o.TotalAmount, "DESC"]).take(5);
            const results = await take.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT TOP 5 [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN (\n\tSELECT TOP 10 [entity1].[OrderId]\n\tFROM [Orders] AS [entity1]\n\tORDER BY [entity1].[OrderDate] DESC\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nORDER BY [entity0].[TotalAmount] DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in include", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const take = db.orders.include((o) => o.OrderDetails.orderBy([(o) => o.quantity]).take(10).skip(1).take(2).skip(1));
            const results = await take.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN (\n\tSELECT [entity2].[OrderDetailId],\n\t\tCOUNT([entity2].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity2]\n\tINNER JOIN (\n\t\tSELECT [entity3].[OrderDetailId],\n\t\t\t[entity3].[OrderId],\n\t\t\t[entity3].[Quantity]\n\t\tFROM [OrderDetails] AS [entity3]\n\t\tWHERE ([entity3].[isDeleted]=0)\n\t) AS [entity3]\n\t\tON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]>[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))\n\tWHERE ([entity2].[isDeleted]=0)\n\tGROUP BY [entity2].[OrderDetailId]\n\tHAVING ((COUNT([entity2].[OrderDetailId])>2) AND (COUNT([entity2].[OrderDetailId])<=3))\n) AS [entity2]\n\tON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0)\nORDER BY [entity1].[Quantity] ASC;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            const any = results.any((o) => o.OrderDetails.count() > 1);
            expect(typeof any).toBe("boolean");
            expect(any).toBe(false);
        });
        it("should work in include 2 (consider orderBy after take)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const take = db.orders.
                include((o) => o.OrderDetails
                    .orderBy([(o) => o.quantity, "DESC"])
                    .take(5).skip(1)
                    .orderBy([(o) => o.name])
                    .take(3)
                ).take(10);
            const results = await take.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN (\n\tSELECT [entity4].[OrderDetailId]\n\tFROM [OrderDetails] AS [entity4]\n\tINNER JOIN (\n\t\tSELECT [entity2].[OrderDetailId],\n\t\t\tCOUNT([entity2].[OrderDetailId]) AS [column0]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tINNER JOIN (\n\t\t\tSELECT [entity3].[OrderDetailId],\n\t\t\t\t[entity3].[OrderId],\n\t\t\t\t[entity3].[Quantity]\n\t\t\tFROM [OrderDetails] AS [entity3]\n\t\t\tWHERE ([entity3].[isDeleted]=0)\n\t\t) AS [entity3]\n\t\t\tON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]<[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))\n\t\tWHERE ([entity2].[isDeleted]=0)\n\t\tGROUP BY [entity2].[OrderDetailId]\n\t\tHAVING ((COUNT([entity2].[OrderDetailId])>1) AND (COUNT([entity2].[OrderDetailId])<=5))\n\t) AS [entity2]\n\t\tON ([entity4].[OrderDetailId]=[entity2].[OrderDetailId])\n\tWHERE ([entity4].[isDeleted]=0)\n) AS [entity4]\n\tON ([entity1].[OrderDetailId]=[entity4].[OrderDetailId])\nINNER JOIN (\n\tSELECT [entity5].[OrderDetailId],\n\t\tCOUNT([entity5].[OrderDetailId]) AS [column1]\n\tFROM [OrderDetails] AS [entity5]\n\tINNER JOIN (\n\t\tSELECT [entity4].[OrderDetailId]\n\t\tFROM [OrderDetails] AS [entity4]\n\t\tINNER JOIN (\n\t\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t\tCOUNT([entity2].[OrderDetailId]) AS [column0]\n\t\t\tFROM [OrderDetails] AS [entity2]\n\t\t\tINNER JOIN (\n\t\t\t\tSELECT [entity3].[OrderDetailId],\n\t\t\t\t\t[entity3].[OrderId],\n\t\t\t\t\t[entity3].[Quantity]\n\t\t\t\tFROM [OrderDetails] AS [entity3]\n\t\t\t\tWHERE ([entity3].[isDeleted]=0)\n\t\t\t) AS [entity3]\n\t\t\t\tON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]<[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))\n\t\t\tWHERE ([entity2].[isDeleted]=0)\n\t\t\tGROUP BY [entity2].[OrderDetailId]\n\t\t\tHAVING ((COUNT([entity2].[OrderDetailId])>1) AND (COUNT([entity2].[OrderDetailId])<=5))\n\t\t) AS [entity2]\n\t\t\tON ([entity4].[OrderDetailId]=[entity2].[OrderDetailId])\n\t\tWHERE ([entity4].[isDeleted]=0)\n\t) AS [entity4]\n\t\tON ([entity5].[OrderDetailId]=[entity4].[OrderDetailId])\n\tINNER JOIN (\n\t\tSELECT [entity6].[OrderDetailId],\n\t\t\t[entity6].[OrderId],\n\t\t\t[entity6].[ProductName]\n\t\tFROM [OrderDetails] AS [entity6]\n\t\tINNER JOIN (\n\t\t\tSELECT [entity4].[OrderDetailId]\n\t\t\tFROM [OrderDetails] AS [entity4]\n\t\t\tINNER JOIN (\n\t\t\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t\t\tCOUNT([entity2].[OrderDetailId]) AS [column0]\n\t\t\t\tFROM [OrderDetails] AS [entity2]\n\t\t\t\tINNER JOIN (\n\t\t\t\t\tSELECT [entity3].[OrderDetailId],\n\t\t\t\t\t\t[entity3].[OrderId],\n\t\t\t\t\t\t[entity3].[Quantity]\n\t\t\t\t\tFROM [OrderDetails] AS [entity3]\n\t\t\t\t\tWHERE ([entity3].[isDeleted]=0)\n\t\t\t\t) AS [entity3]\n\t\t\t\t\tON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]<[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))\n\t\t\t\tWHERE ([entity2].[isDeleted]=0)\n\t\t\t\tGROUP BY [entity2].[OrderDetailId]\n\t\t\t\tHAVING ((COUNT([entity2].[OrderDetailId])>1) AND (COUNT([entity2].[OrderDetailId])<=5))\n\t\t\t) AS [entity2]\n\t\t\t\tON ([entity4].[OrderDetailId]=[entity2].[OrderDetailId])\n\t\t\tWHERE ([entity4].[isDeleted]=0)\n\t\t) AS [entity4]\n\t\t\tON ([entity6].[OrderDetailId]=[entity4].[OrderDetailId])\n\t) AS [entity6]\n\t\tON (([entity6].[OrderId]=[entity5].[OrderId]) AND (([entity6].[ProductName]>[entity5].[ProductName]) OR (([entity6].[ProductName]=[entity5].[ProductName]) AND ([entity6].[OrderDetailId]>=[entity5].[OrderDetailId]))))\n\tGROUP BY [entity5].[OrderDetailId]\n\tHAVING (COUNT([entity5].[OrderDetailId])<=3)\n) AS [entity5]\n\tON ([entity1].[OrderDetailId]=[entity5].[OrderDetailId])\nINNER JOIN (\n\tSELECT TOP 10 [entity0].[OrderId],\n\t\t[entity0].[TotalAmount],\n\t\t[entity0].[OrderDate]\n\tFROM [Orders] AS [entity0]\n) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])\nORDER BY [entity1].[ProductName] ASC;\n\nSELECT TOP 10 [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            const any = results.any((o) => o.OrderDetails.count() > 3);
            expect(typeof any).toBe("boolean");
            expect(any).toBe(false);
        });
    });
    describe("FIRST", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.first();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT TOP 1 [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBeInstanceOf(Order);
            expect(db.orders.local.count()).toBe(1);
        });
        it("should work with where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.where((o) => o.OrderDate < new Date()).first((o) => o.TotalAmount > 20000);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT TOP 1 [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE (([entity0].[OrderDate]<getdate()) AND ([entity0].[TotalAmount]>20000))");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBeInstanceOf(Order);
            expect(db.orders.local.count()).toBe(1);
        });
        it("should work with select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const first = db.orders.select((o) => ({
                order: o,
                lastAddedItem: o.OrderDetails.orderBy([(o) => o.CreatedDate, "DESC"]).first()
            }));
            const results = await first.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity2].[OrderDetailId],\n\t[entity2].[OrderId],\n\t[entity2].[ProductId],\n\t[entity2].[ProductName],\n\t[entity2].[Quantity],\n\t[entity2].[CreatedDate],\n\t[entity2].[isDeleted]\nFROM [OrderDetails] AS [entity2]\nINNER JOIN (\n\tSELECT [entity3].[OrderDetailId],\n\t\tCOUNT([entity3].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity3]\n\tINNER JOIN (\n\t\tSELECT [entity4].[OrderDetailId],\n\t\t\t[entity4].[OrderId],\n\t\t\t[entity4].[CreatedDate],\n\t\t\t[entity4].[ProductId],\n\t\t\t[entity4].[ProductName],\n\t\t\t[entity4].[Quantity],\n\t\t\t[entity4].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity4]\n\t\tWHERE ([entity4].[isDeleted]=0)\n\t) AS [entity4]\n\t\tON (([entity4].[OrderId]=[entity3].[OrderId]) AND (([entity4].[CreatedDate]<[entity3].[CreatedDate]) OR (([entity4].[CreatedDate]=[entity3].[CreatedDate]) AND ([entity4].[OrderDetailId]>=[entity3].[OrderDetailId]))))\n\tWHERE ([entity3].[isDeleted]=0)\n\tGROUP BY [entity3].[OrderDetailId]\n\tHAVING (COUNT([entity3].[OrderDetailId])<=1)\n) AS [entity3]\n\tON ([entity2].[OrderDetailId]=[entity3].[OrderDetailId])\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId])\nWHERE ([entity2].[isDeleted]=0)\nORDER BY [entity2].[CreatedDate] DESC;\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(o.lastAddedItem).toBeInstanceOf(OrderDetail);
            }
        });
    });
    describe("DISTINCT", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const distinct = db.orders.select((o) => o.TotalAmount).distinct();
            const results = await distinct.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DISTINCT [entity0].[TotalAmount]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
            expect(results).has.lengthOf(results.distinct().count());
        });
        it("should work with select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const distinct = db.orders.select((o) => ({
                order: o,
                quantities: o.OrderDetails.select((p) => p.quantity).distinct().toArray()
            }));
            const results = await distinct.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN [Orders] AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT DISTINCT [entity2].[OrderId],\n\t[entity2].[Quantity]\nFROM [OrderDetails] AS [entity2]\nINNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId])\nWHERE ([entity2].[isDeleted]=0);\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(o.quantities).toBeInstanceOf(Array);
                expect(o.quantities.length).toBeGreaterThan(0);
                for (const od of o.quantities) {
                    expect(typeof od).toBe("number");
                }
                expect(o.quantities).have.lengthOf(o.quantities.distinct().count());
            }
        });
    });
    describe("GROUP BY", async () => {
        it("groupBy.(o => o.column).select(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate).select((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nGROUP BY [entity0].[OrderDate]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Date);
            }
        });
        it("groupBy.(o => o.column).select(o => o.key.method())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate).select((o) => o.key.getDate());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DAY([entity0].[OrderDate]) AS [column0]\nFROM [Orders] AS [entity0]\nGROUP BY [entity0].[OrderDate]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.column).select(o => o.count())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate).select((o) => o.count());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT COUNT([entity0].[OrderId]) AS [column0]\nFROM [Orders] AS [entity0]\nGROUP BY [entity0].[OrderDate]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.column + o.column).select(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate() + o.OrderDate.getFullYear()).select((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate])) AS [column0]\nFROM [Orders] AS [entity0]\nGROUP BY (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate]))");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.column + o.column).select(o => {column: o.key, count: o.count(), sum: o.sum()})", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate() + o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate])) AS [column0],\n\tCOUNT([entity0].[OrderId]) AS [column1],\n\tSUM([entity1].[TotalAmount]) AS [column2]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\t[entity1].[TotalAmount]\n\tFROM [Orders] AS [entity1]\n\tWHERE ([entity1].[TotalAmount]<10000)\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nGROUP BY (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate]))");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.dateYear).toBe("number");
                expect(typeof o.count).toBe("number")
                expect(o.count).greaterThan(0);
                expect(typeof o.sum).toBe("number");
            }
        });
        it("groupBy computed column", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => o.GrossSales);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted],\n\t([entity0].[Quantity]*[entity1].[Price]) AS [GrossSales]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON ([entity0].[ProductId]=[entity1].[ProductId])\nWHERE ([entity0].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.key).toBe("number");
                for (const od of o) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("groupBy computed column complex 1", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.take(100).where((o) => o.GrossSales > 10000).select((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).select((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.where((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT YEAR([entity2].[OrderDate]) AS [column0],\n\tCOUNT([entity2].[OrderId]) AS [column1],\n\tSUM([entity3].[TotalAmount]) AS [column2]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT TOP 100 [entity0].[OrderDetailId],\n\t\t[entity0].[OrderId],\n\t\t[entity0].[ProductId],\n\t\t[entity0].[ProductName],\n\t\t[entity0].[Quantity],\n\t\t[entity0].[CreatedDate],\n\t\t[entity0].[isDeleted]\n\tFROM [OrderDetails] AS [entity0]\n\tLEFT JOIN [Products] AS [entity1]\n\t\tON ([entity0].[ProductId]=[entity1].[ProductId])\n\tWHERE (([entity0].[isDeleted]=0) AND (([entity0].[Quantity]*[entity1].[Price])>10000))\n) AS [entity0]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nLEFT JOIN (\n\tSELECT [entity3].[OrderId],\n\t\t[entity3].[TotalAmount]\n\tFROM [Orders] AS [entity3]\n\tWHERE ([entity3].[TotalAmount]<10000)\n) AS [entity3]\n\tON ([entity2].[OrderId]=[entity3].[OrderId])\nGROUP BY YEAR([entity2].[OrderDate])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.dateYear).toBe("number");
                expect(typeof o.count).toBe("number");
                expect(o.count).greaterThan(0);
                expect(typeof o.sum).toBe("number");
            }
        });
        it("groupBy.(o => o.column.method()).select(o => o.toArray())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate()).select((o) => o.toArray());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate],\n\tDAY([entity1].[OrderDate]) AS [column0]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT DAY([entity0].[OrderDate]) AS [column0]\n\tFROM [Orders] AS [entity0]\n\tGROUP BY DAY([entity0].[OrderDate])\n) AS [entity0]\n\tON ([entity0].[column0]=DAY([entity1].[OrderDate]))");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Array);
                for (const od of o) {
                    expect(od).toBeInstanceOf(Order);
                }
            }
        });
        it("groupBy.(o => o.column.method()).select(o => ({items: o}))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate()).select((o) => ({
                details: o.toArray()
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\tDAY([entity1].[OrderDate]) AS [column0],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT DAY([entity0].[OrderDate]) AS [column0]\n\tFROM [Orders] AS [entity0]\n\tGROUP BY DAY([entity0].[OrderDate])\n) AS [entity0] ON ([entity0].[column0]=DAY([entity1].[OrderDate]));\n\nSELECT DAY([entity0].[OrderDate]) AS [column0]\nFROM [Orders] AS [entity0]\nGROUP BY DAY([entity0].[OrderDate])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.details).toBeInstanceOf(Array);
                for (const od of o.details) {
                    expect(od).toBeInstanceOf(Order);
                }
            }
        });
        it("groupBy.(o => o.toOneRelation).select(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.where((o) => o.quantity > 1).groupBy((o) => o.Order).select((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId]\n\tFROM [OrderDetails] AS [entity0]\n\tWHERE (([entity0].[isDeleted]=0) AND ([entity0].[Quantity]>1))\n\tGROUP BY [entity0].[OrderId]\n) AS [entity0]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("groupBy.(o => o.toOneRelation).select(o => o.key.column.method())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => o.Order).select((o) => o.key.OrderDate.getDate());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT DAY([entity1].[OrderDate]) AS [column0]\nFROM [OrderDetails] AS [entity0]\nINNER JOIN [Orders] AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY [entity0].[OrderId], [entity1].[OrderDate]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.toOneRelation).select(o => o.count())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => o.Order).select((o) => o.count());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT COUNT([entity0].[OrderDetailId]) AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY [entity0].[OrderId]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.toOneRelation.toOneRelation).select(o => o.key.column)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => o.OrderDetail.Order).select((o) => o.key.OrderDate);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderId],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderId]\n\tFROM [OrderDetailProperties] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE ([entity1].[isDeleted]=0)\n\t) AS [entity1]\n\t\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\n\tGROUP BY [entity1].[OrderId]\n) AS [entity0]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Date);
            }
        });
        it("groupBy.(o => o.toOneRelation).select(o => {col: o.key, count: o.count(), sum: o.where().sum()})", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => o.Order).select((o) => ({
                order: o.key,
                count: o.count(),
                sum: o.where((o) => o.quantity > 1).sum((o) => o.quantity)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\tCOUNT([entity0].[OrderDetailId]) AS [column0],\n\t\tSUM([entity2].[Quantity]) AS [column1]\n\tFROM [OrderDetails] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderDetailId],\n\t\t\t[entity2].[Quantity]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tWHERE ([entity2].[Quantity]>1)\n\t) AS [entity2]\n\t\tON ([entity0].[OrderDetailId]=[entity2].[OrderDetailId])\n\tWHERE ([entity0].[isDeleted]=0)\n\tGROUP BY [entity0].[OrderId]\n) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\tCOUNT([entity0].[OrderDetailId]) AS [column0],\n\tSUM([entity2].[Quantity]) AS [column1]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderDetailId],\n\t\t[entity2].[Quantity]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[Quantity]>1)\n) AS [entity2]\n\tON ([entity0].[OrderDetailId]=[entity2].[OrderDetailId])\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY [entity0].[OrderId]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(typeof o.count).toBe("number");
                expect(typeof o.sum).toBe("number");
            }
        });
        it("groupBy(o => ({obj: {prop: o.col} })).select(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                obj: {
                    pid: o.ProductId
                },
                Quantity: o.quantity * 2
            })).select((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT ([entity0].[Quantity]*2) AS [column1],\n\t[entity0].[ProductId] AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY ([entity0].[Quantity]*2), [entity0].[ProductId]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.obj).toBeInstanceOf(Object);
                expect(o.obj.pid).toBeInstanceOf(Uuid);
                expect(typeof o.Quantity).toBe("number");
            }
        });
        it("groupBy(o => ({obj: {prop: o.col} })).select(o => o.key.obj)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                obj: {
                    pid: o.ProductId
                },
                Quantity: o.quantity * 2
            })).select((o) => o.key.obj);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[ProductId] AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY ([entity0].[Quantity]*2), [entity0].[ProductId]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.pid).toBeInstanceOf(Uuid);
            }
        });
        it("groupBy(o => ({obj: {prop: o.col} })).select(o => o.key.obj.prop)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                obj: {
                    pid: o.ProductId
                },
                Quantity: o.quantity * 2
            })).select((o) => o.key.obj.pid);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[ProductId] AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY ([entity0].[Quantity]*2), [entity0].[ProductId]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Uuid);
            }
        });
        it("groupBy(o => o.toOneRelation.toOneRelation).select(o => {col: o.key, count: o.count(), sum: o.where().sum()})", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => o.OrderDetail.Order).select((o) => ({
                order: o.key,
                count: o.count(),
                sum: o.where((o) => o.amount < 20000).sum((o) => o.amount)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderId],\n\t[entity2].[TotalAmount],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity0].[OrderDetailPropertyId]) AS [column0],\n\t\tSUM([entity3].[Amount]) AS [column1]\n\tFROM [OrderDetailProperties] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE ([entity1].[isDeleted]=0)\n\t) AS [entity1]\n\t\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\n\tLEFT JOIN (\n\t\tSELECT [entity3].[OrderDetailPropertyId],\n\t\t\t[entity3].[Amount]\n\t\tFROM [OrderDetailProperties] AS [entity3]\n\t\tWHERE ([entity3].[Amount]<20000)\n\t) AS [entity3]\n\t\tON ([entity0].[OrderDetailPropertyId]=[entity3].[OrderDetailPropertyId])\n\tGROUP BY [entity1].[OrderId]\n) AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId]);\n\nSELECT [entity1].[OrderId],\n\tCOUNT([entity0].[OrderDetailPropertyId]) AS [column0],\n\tSUM([entity3].[Amount]) AS [column1]\nFROM [OrderDetailProperties] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\nLEFT JOIN (\n\tSELECT [entity3].[OrderDetailPropertyId],\n\t\t[entity3].[Amount]\n\tFROM [OrderDetailProperties] AS [entity3]\n\tWHERE ([entity3].[Amount]<20000)\n) AS [entity3]\n\tON ([entity0].[OrderDetailPropertyId]=[entity3].[OrderDetailPropertyId])\nGROUP BY [entity1].[OrderId]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.order).toBeInstanceOf(Order);
                expect(typeof o.count).toBe("number");
                expect(typeof o.sum).toBe("number");
            }
        });
        it("groupBy(o => o.toOneRelation).select(o => o.key.toOneRelation)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => o.OrderDetail).select((o) => o.key.Order);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderId],\n\t[entity2].[TotalAmount],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN (\n\t\tSELECT [entity0].[OrderDetailId]\n\t\tFROM [OrderDetailProperties] AS [entity0]\n\t\tGROUP BY [entity0].[OrderDetailId]\n\t) AS [entity0]\n\t\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity2].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).select(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).select((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[ProductId],\n\t([entity0].[Quantity]*2) AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.productid).toBeInstanceOf(Uuid);
                expect(typeof o.Quantity).toBe("number");
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).select(o => o.count())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).select((o) => o.count());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT COUNT([entity0].[OrderDetailId]) AS [column1]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).select(o => o.key.col)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).select((o) => o.key.Quantity);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT ([entity0].[Quantity]*2) AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).select(o => ({ col: { col: col }}))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).select((o) => ({
                data: {
                    pid: o.key.productid,
                    qty: o.key.Quantity,
                    avg: o.avg((o) => o.quantity)
                },
                count: o.count(),
                sum: o.where((o) => o.quantity > 1).sum((o) => o.quantity)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT COUNT([entity0].[OrderDetailId]) AS [column3],\n\tSUM([entity2].[Quantity]) AS [column4],\n\t[entity0].[ProductId] AS [column1],\n\t([entity0].[Quantity]*2) AS [column0],\n\tAVG([entity1].[Quantity]) AS [column2]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderDetailId],\n\t\t[entity2].[Quantity]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[Quantity]>1)\n) AS [entity2]\n\tON ([entity0].[OrderDetailId]=[entity2].[OrderDetailId])\nLEFT JOIN [OrderDetails] AS [entity1]\n\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.count).toBe("number");
                expect(typeof o.sum).toBe("number");
                expect(o.data).have.keys(["pid", "qty", "avg"]);
            }
        });
        it("groupBy(o => ({col: o.toOneRelation.column.method(), col: o.toOneRelation.column })).select(o => ({ col: { col: col }}))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                date: o.Order.OrderDate.getDate(),
                price: o.Product.Price
            })).select((o) => ({
                data: {
                    day: o.key.date,
                    price: o.key.price,
                    avg: o.avg((o) => o.quantity)
                },
                count: o.count(),
                sum: o.where((o) => o.quantity > 1).sum((o) => o.quantity)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT COUNT([entity0].[OrderDetailId]) AS [column3],\n\tSUM([entity4].[Quantity]) AS [column4],\n\tDAY([entity1].[OrderDate]) AS [column0],\n\t[entity2].[Price] AS [column1],\n\tAVG([entity3].[Quantity]) AS [column2]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Orders] AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity0].[ProductId]=[entity2].[ProductId])\nLEFT JOIN (\n\tSELECT [entity4].[OrderDetailId],\n\t\t[entity4].[Quantity]\n\tFROM [OrderDetails] AS [entity4]\n\tWHERE ([entity4].[Quantity]>1)\n) AS [entity4]\n\tON ([entity0].[OrderDetailId]=[entity4].[OrderDetailId])\nLEFT JOIN [OrderDetails] AS [entity3]\n\tON ([entity0].[OrderDetailId]=[entity3].[OrderDetailId])\nWHERE ([entity0].[isDeleted]=0)\nGROUP BY DAY([entity1].[OrderDate]), [entity2].[Price]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.count).toBe("number");
                expect(typeof o.sum).toBe("number");
                expect(o.data).have.keys(["day", "price", "avg"]);
            }
        });
        it("groupBy.(o => ({col: o.toOneRelation })).select(o => o.key).select(o => o.col.name)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => ({
                od: o.OrderDetail
            })).select((o) => o.key).select((o) => o.od.name);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[ProductName]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailId]\n\tFROM [OrderDetailProperties] AS [entity0]\n\tGROUP BY [entity0].[OrderDetailId]\n) AS [entity0]\n\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\nWHERE ([entity1].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("string");
            }
        });
        it("groupBy.(o => o.column.method())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.where((o) => o.TotalAmount > 20000).groupBy((o) => o.OrderDate.getDate())
                .where((o) => o.count() > 3);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate],\n\tDAY([entity0].[OrderDate]) AS [column0]\nFROM [Orders] AS [entity0]\nINNER JOIN (\n\tSELECT DISTINCT DAY([rel_entity0].[OrderDate]) AS [column0]\n\tFROM [Orders] AS [rel_entity0]\n\tWHERE ([rel_entity0].[TotalAmount]>20000)\n\tGROUP BY DAY([rel_entity0].[OrderDate])\n\tHAVING (COUNT([rel_entity0].[OrderId])>3)\n) AS [rel_entity0]\n\tON (DAY([entity0].[OrderDate])=[rel_entity0].[column0])\nWHERE ([entity0].[TotalAmount]>20000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Array);
                expect(typeof o.key).toBe("number");
                for (const od of o) {
                    expect(od).toBeInstanceOf(Order);
                }
            }
        });
        it("groupBy.(o => o.toOneRelation.toOneRelation)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => o.OrderDetail.Order);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity2].[OrderId],\n\t[entity2].[TotalAmount],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailPropertyId],\n\t\t[entity0].[OrderDetailId],\n\t\t[entity0].[Name],\n\t\t[entity0].[Amount],\n\t\t[entity1].[OrderId]\n\tFROM [OrderDetailProperties] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE ([entity1].[isDeleted]=0)\n\t) AS [entity1]\n\t\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\n) AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId]);\n\nSELECT [entity0].[OrderDetailPropertyId],\n\t[entity0].[OrderDetailId],\n\t[entity0].[Name],\n\t[entity0].[Amount],\n\t[entity1].[OrderId]\nFROM [OrderDetailProperties] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(Array.isArray(o)).toBe(true);
                expect(o.key).toBeInstanceOf(Order);
                for (const od of o) {
                    expect(od).toBeInstanceOf(OrderDetailProperty);
                }
            }
        });
        it("groupBy.(o => ({col: o.toOneRelation.column.method(), col: o.toOneRelation.column }))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                date: o.Order.OrderDate.getDate(),
                price: o.Product.Price
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted],\n\tDAY([entity1].[OrderDate]) AS [column0],\n\t[entity2].[Price]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Orders] AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity0].[ProductId]=[entity2].[ProductId])\nWHERE ([entity0].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Array);
                expect(typeof o.key.price).toBe("number");
                for (const od of o) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("groupBy(o => ({obj: {prop: o.col} }))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                obj: {
                    pid: o.ProductId
                },
                Quantity: o.quantity * 2
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted],\n\t([entity0].[Quantity]*2) AS [column1],\n\t[entity0].[ProductId] AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE ([entity0].[isDeleted]=0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.key).toBeInstanceOf(Object);
                expect(o.key.obj).toBeInstanceOf(Object);
                expect(o.key.obj.pid).toBeInstanceOf(Uuid);
                expect(typeof o.key.Quantity).toBe("number");
                for (const od of o) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("groupBy.(o => ({col: o.toOneRelation }))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => ({
                od: o.OrderDetail
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailPropertyId],\n\t\t[entity0].[OrderDetailId],\n\t\t[entity0].[Name],\n\t\t[entity0].[Amount]\n\tFROM [OrderDetailProperties] AS [entity0]\n) AS [entity0] ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderDetailPropertyId],\n\t[entity0].[OrderDetailId],\n\t[entity0].[Name],\n\t[entity0].[Amount]\nFROM [OrderDetailProperties] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Array);
                expect(o.key.od).toBeInstanceOf(OrderDetail);
                for (const od of o) {
                    expect(od).toBeInstanceOf(OrderDetailProperty);
                }
            }
        });
    });
    describe("TOMAP", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const results = await db.orders.toMap((o) => o.OrderId, (o) => o.OrderDate);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[OrderId] AS [column0],\n\t[entity0].[OrderDate] AS [column1]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Map);
            expect(results.size).toBeGreaterThan(0);
            for (const [key, value] of results) {
                expect(key).toBeInstanceOf(Uuid);
                expect(value).toBeInstanceOf(Date);
            }
        });
        it("should support self select and keep defined includes", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const results = await db.orders.include((o) => o.OrderDetails).toMap((o) => o.OrderId, (o) => o);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN (\n\tSELECT [entity2].[OrderId],\n\t\t[entity2].[TotalAmount],\n\t\t[entity2].[OrderDate]\n\tFROM [Orders] AS [entity2]\n\tINNER JOIN (\n\t\tSELECT [entity0].[OrderId],\n\t\t\t[entity0].[OrderId] AS [column0]\n\t\tFROM [Orders] AS [entity0]\n\t) AS [entity0] ON ([entity2].[OrderId]=[entity0].[OrderId])\n) AS [entity2] ON ([entity2].[OrderId]=[entity1].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity2].[OrderId],\n\t[entity2].[TotalAmount],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity0].[OrderId] AS [column0]\n\tFROM [Orders] AS [entity0]\n) AS [entity0] ON ([entity2].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId],\n\t[entity0].[OrderId] AS [column0]\nFROM [Orders] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Map);
            expect(results.size).toBeGreaterThan(0);
            for (const [key, value] of results) {
                expect(key).toBeInstanceOf(Uuid);
                expect(value).toBeInstanceOf(Order);
                for (const o of value.OrderDetails) {
                    expect(o).toBeInstanceOf(OrderDetail);
                }
            }
        });
    });
    describe("JOIN", async () => {
        it("should support inner join", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const join = db.orders.innerJoin(db.orderDetails, (o1, o2) => o1.OrderId === o2.OrderId, (o1, o2) => ({
                quantity: o2.quantity,
                name: o2.name,
                price: o2.Product.Price,
                date: o1.OrderDate
            })).where((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity1].[Quantity] AS [column0],\n\t[entity1].[ProductName] AS [column1],\n\t[entity2].[Price] AS [column2],\n\t[entity0].[OrderDate] AS [column3]\nFROM [Orders] AS [entity0]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nWHERE ([entity1].[Quantity]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.quantity).toBe("number");
                expect(typeof o.name).toBe("string");
                expect(typeof o.price).toBe("number");
                expect(o.date).toBeInstanceOf(Date);
            }
        });
        it("should support left join", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const join = db.orders.leftJoin(db.orderDetails, (o1, o2) => o1.OrderId === o2.OrderId, (o1, o2) => ({
                quantity: o2.quantity,
                name: o2.name,
                price: o2.Product.Price,
                date: o1.OrderDate,
                propertyNames: o2.OrderDetailProperties.select((o) => o.name).toArray()
            })).where((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity3].[OrderDetailPropertyId],\n\t[entity3].[OrderDetailId],\n\t[entity3].[Name]\nFROM [OrderDetailProperties] AS [entity3]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity1].[OrderDetailId],\n\t\t[entity1].[Quantity] AS [column0],\n\t\t[entity1].[ProductName] AS [column1],\n\t\t[entity2].[Price] AS [column2],\n\t\t[entity0].[OrderDate] AS [column3]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE ([entity1].[isDeleted]=0)\n\t) AS [entity1]\n\t\tON ([entity0].[OrderId]=[entity1].[OrderId])\n\tLEFT JOIN [Products] AS [entity2]\n\t\tON ([entity1].[ProductId]=[entity2].[ProductId])\n\tWHERE ([entity1].[Quantity]>1)\n) AS [entity0] ON ([entity0].[OrderDetailId]=[entity3].[OrderDetailId]);\n\nSELECT [entity0].[OrderId],\n\t[entity1].[OrderDetailId],\n\t[entity1].[Quantity] AS [column0],\n\t[entity1].[ProductName] AS [column1],\n\t[entity2].[Price] AS [column2],\n\t[entity0].[OrderDate] AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nWHERE ([entity1].[Quantity]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.quantity).toBe("number");
                expect(typeof o.name).toBe("string");
                expect(typeof o.price).toBe("number");
                expect(o.date).toBeInstanceOf(Date);
                expect(o.propertyNames).toBeInstanceOf(Array);
                for (const o2 of o.propertyNames) {
                    expect(typeof o2).toBe("string");
                }
            }
        });
        it("should support right join", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const join = db.orders.rightJoin(db.orderDetails, (o1, o2) => o1.OrderId === o2.OrderId, (o1, o2) => ({
                quantity: o2.quantity,
                name: o2.name,
                price: o2.Product.Price,
                date: o1.OrderDate
            })).where((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity1].[Quantity] AS [column0],\n\t[entity1].[ProductName] AS [column1],\n\t[entity2].[Price] AS [column2],\n\t[entity0].[OrderDate] AS [column3]\nFROM [Orders] AS [entity0]\nRIGHT JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nWHERE ([entity1].[Quantity]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.quantity).toBe("number");
                expect(typeof o.name).toBe("string");
                expect(typeof o.price).toBe("number");
                expect(o.date).toBeInstanceOf(Date);
            }
        });
        it("should support full join", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const join = db.orders.fullJoin(db.orderDetails, (o1, o2) => o1.OrderId === o2.OrderId, (o1, o2) => ({
                quantity: o2.quantity,
                name: o2.name,
                price: o2.Product.Price,
                date: o1.OrderDate
            })).where((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity1].[Quantity] AS [column0],\n\t[entity1].[ProductName] AS [column1],\n\t[entity2].[Price] AS [column2],\n\t[entity0].[OrderDate] AS [column3]\nFROM [Orders] AS [entity0]\nFULL JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nWHERE ([entity1].[Quantity]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.quantity).toBe("number");
                expect(typeof o.name).toBe("string");
                expect(typeof o.price).toBe("number");
                expect(o.date).toBeInstanceOf(Date);
            }
        });
        it("should support group join", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const join = db.orders.groupJoin(db.orderDetails, (o1, o2) => o1.OrderId === o2.OrderId, (o1, o2) => ({
                quantity: o2.sum((d) => d.quantity),
                names: o2.select((d) => d.name).toArray(),
                price: o2.sum((d) => d.Product.Price),
                date: o1.OrderDate
            })).where((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity3].[OrderDetailId],\n\t[entity3].[OrderId],\n\t[entity3].[ProductName]\nFROM [OrderDetails] AS [entity3]\nINNER JOIN (\n\tSELECT [entity0].[OrderId],\n\t\t[entity2].[column0] AS [column1],\n\t\t[entity5].[column2] AS [column3],\n\t\t[entity0].[OrderDate] AS [column4]\n\tFROM [Orders] AS [entity0]\n\tLEFT JOIN (\n\t\tSELECT [entity2].[OrderId],\n\t\t\tSUM([entity2].[Quantity]) AS [column0]\n\t\tFROM [OrderDetails] AS [entity2]\n\t\tWHERE ([entity2].[isDeleted]=0)\n\t\tGROUP BY [entity2].[OrderId]\n\t) AS [entity2]\n\t\tON ([entity0].[OrderId]=[entity2].[OrderId])\n\tLEFT JOIN (\n\t\tSELECT [entity4].[OrderId],\n\t\t\tSUM([entity5].[Price]) AS [column2]\n\t\tFROM [Products] AS [entity5]\n\t\tINNER JOIN (\n\t\t\tSELECT [entity4].[OrderDetailId],\n\t\t\t\t[entity4].[ProductId],\n\t\t\t\t[entity4].[OrderId],\n\t\t\t\t[entity4].[ProductName],\n\t\t\t\t[entity4].[Quantity],\n\t\t\t\t[entity4].[CreatedDate],\n\t\t\t\t[entity4].[isDeleted]\n\t\t\tFROM [OrderDetails] AS [entity4]\n\t\t\tWHERE ([entity4].[isDeleted]=0)\n\t\t) AS [entity4]\n\t\t\tON ([entity4].[ProductId]=[entity5].[ProductId])\n\t\tGROUP BY [entity4].[OrderId]\n\t) AS [entity5]\n\t\tON ([entity0].[OrderId]=[entity5].[OrderId])\n\tWHERE ([entity2].[column0]>1)\n) AS [entity0] ON ([entity0].[OrderId]=[entity3].[OrderId])\nWHERE ([entity3].[isDeleted]=0);\n\nSELECT [entity0].[OrderId],\n\t[entity2].[column0] AS [column1],\n\t[entity5].[column2] AS [column3],\n\t[entity0].[OrderDate] AS [column4]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tSUM([entity2].[Quantity]) AS [column0]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[isDeleted]=0)\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nLEFT JOIN (\n\tSELECT [entity4].[OrderId],\n\t\tSUM([entity5].[Price]) AS [column2]\n\tFROM [Products] AS [entity5]\n\tINNER JOIN (\n\t\tSELECT [entity4].[OrderDetailId],\n\t\t\t[entity4].[ProductId],\n\t\t\t[entity4].[OrderId],\n\t\t\t[entity4].[ProductName],\n\t\t\t[entity4].[Quantity],\n\t\t\t[entity4].[CreatedDate],\n\t\t\t[entity4].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity4]\n\t\tWHERE ([entity4].[isDeleted]=0)\n\t) AS [entity4]\n\t\tON ([entity4].[ProductId]=[entity5].[ProductId])\n\tGROUP BY [entity4].[OrderId]\n) AS [entity5]\n\tON ([entity0].[OrderId]=[entity5].[OrderId])\nWHERE ([entity2].[column0]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.quantity).toBe("number");
                expect(typeof o.price).toBe("number");
                expect(o.date).toBeInstanceOf(Date);
                expect(o.names).toBeInstanceOf(Array);
                for (const n of o.names) {
                    expect(typeof n).toBe("string");
                }
            }
        });
        it("should support cross join", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const join = db.orders.crossJoin(db.orderDetails, (o1, o2) => ({
                quantity: o2.quantity,
                name: o2.name,
                price: o2.Product.Price,
                date: o1.OrderDate
            })).where((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity1].[Quantity] AS [column0],\n\t[entity1].[ProductName] AS [column1],\n\t[entity2].[Price] AS [column2],\n\t[entity0].[OrderDate] AS [column3]\nFROM [Orders] AS [entity0]\nCROSS JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n) AS [entity1]\nLEFT JOIN [Products] AS [entity2]\n\tON ([entity1].[ProductId]=[entity2].[ProductId])\nWHERE ([entity1].[Quantity]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.quantity).toBe("number");
                expect(typeof o.name).toBe("string");
                expect(typeof o.price).toBe("number");
                expect(o.date).toBeInstanceOf(Date);
            }
        });
    });
    describe("COMBINATORIAL", async () => {
        it("should union 2 records", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const greatest = db.orders.orderBy([(o) => o.TotalAmount, "DESC"]).take(5);
            const worst = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]).take(5);
            const join = greatest.union(worst).where((o) => o.OrderDetails.count() > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM (\n\tSELECT TOP 5 [entity0].[OrderId],\n\t\t[entity0].[TotalAmount],\n\t\t[entity0].[OrderDate]\n\tFROM [Orders] AS [entity0]\n\tORDER BY [entity0].[TotalAmount] DESC\n\tUNION\n\tSELECT TOP 5 [entity1].[OrderId],\n\t\t[entity1].[TotalAmount],\n\t\t[entity1].[OrderDate]\n\tFROM [Orders] AS [entity1]\n\tORDER BY [entity1].[TotalAmount] ASC\n) AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tCOUNT([entity2].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[isDeleted]=0)\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nWHERE ([entity2].[column0]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should union all 2 records", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const greatest = db.orders.orderBy([(o) => o.TotalAmount, "DESC"]).take(10);
            const worst = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]).take(5);
            const join = greatest.union(worst, true);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM (\n\tSELECT TOP 10 [entity0].[OrderId],\n\t\t[entity0].[TotalAmount],\n\t\t[entity0].[OrderDate]\n\tFROM [Orders] AS [entity0]\n\tORDER BY [entity0].[TotalAmount] DESC\n\tUNION ALL\n\tSELECT TOP 5 [entity1].[OrderId],\n\t\t[entity1].[TotalAmount],\n\t\t[entity1].[OrderDate]\n\tFROM [Orders] AS [entity1]\n\tORDER BY [entity1].[TotalAmount] ASC\n) AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should intersect 2 records", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const greatest = db.orders.orderBy([(o) => o.TotalAmount, "DESC"]).take(10);
            const worst = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]).take(10);
            const join = greatest.intersect(worst).take(5);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT TOP 5 [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM (\n\tSELECT TOP 10 [entity0].[OrderId],\n\t\t[entity0].[TotalAmount],\n\t\t[entity0].[OrderDate]\n\tFROM [Orders] AS [entity0]\n\tORDER BY [entity0].[TotalAmount] DESC\n\tINTERSECT\n\tSELECT TOP 10 [entity1].[OrderId],\n\t\t[entity1].[TotalAmount],\n\t\t[entity1].[OrderDate]\n\tFROM [Orders] AS [entity1]\n\tORDER BY [entity1].[TotalAmount] ASC\n) AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should except records", async () => {
            const spy = vi.spyOn(db.connection, "query");
            const greatest = db.orders.orderBy([(o) => o.TotalAmount, "DESC"]).take(10);
            const worst = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]).take(5);
            const join = greatest.except(worst).orderBy([(o) => o.TotalAmount, "DESC"]);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM (\n\tSELECT TOP 10 [entity0].[OrderId],\n\t\t[entity0].[TotalAmount],\n\t\t[entity0].[OrderDate]\n\tFROM [Orders] AS [entity0]\n\tORDER BY [entity0].[TotalAmount] DESC\n\tEXCEPT\n\tSELECT TOP 5 [entity1].[OrderId],\n\t\t[entity1].[TotalAmount],\n\t\t[entity1].[OrderDate]\n\tFROM [Orders] AS [entity1]\n\tORDER BY [entity1].[TotalAmount] ASC\n) AS [entity0]\nORDER BY [entity0].[TotalAmount] DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("PIVOT", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const pivot = db.orders.pivot(
                {
                    month: (o) => o.OrderDate.getMonth()
                },
                {
                    total: (o) => o.sum((o) => o.TotalAmount),
                    qty: (o) => o.selectMany((o) => o.OrderDetails).select((o) => o.quantity).sum()
                });
            const results = await pivot.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT (MONTH([entity0].[OrderDate]) - 1) AS [column0],\n\tSUM([entity1].[TotalAmount]) AS [column1],\n\tSUM([entity2].[Quantity]) AS [column2]\nFROM [Orders] AS [entity0]\nLEFT JOIN [Orders] AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN (\n\tSELECT [entity2].[OrderDetailId],\n\t\t[entity2].[OrderId],\n\t\t[entity2].[Quantity]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[isDeleted]=0)\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nGROUP BY (MONTH([entity0].[OrderDate]) - 1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.month).toBe("number");
                expect(typeof o.total).toBe("number");
                expect(typeof o.qty).toBe("number");
            }
        });
        it("support where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const pivot = db.orders.pivot(
                {
                    month: (o) => o.OrderDate.getMonth()
                }, {
                total: (o) => o.sum((o) => o.TotalAmount),
                qty: (o) => o.selectMany((o) => o.OrderDetails).select((o) => o.quantity).sum()
            }).where((o) => o.month >= 10);
            const results = await pivot.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT (MONTH([entity0].[OrderDate]) - 1) AS [column0],\n\tSUM([entity1].[TotalAmount]) AS [column1],\n\tSUM([entity2].[Quantity]) AS [column2]\nFROM [Orders] AS [entity0]\nLEFT JOIN [Orders] AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])\nLEFT JOIN (\n\tSELECT [entity2].[OrderDetailId],\n\t\t[entity2].[OrderId],\n\t\t[entity2].[Quantity]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[isDeleted]=0)\n) AS [entity2]\n\tON ([entity0].[OrderId]=[entity2].[OrderId])\nGROUP BY (MONTH([entity0].[OrderDate]) - 1)\nHAVING ((MONTH([entity0].[OrderDate]) - 1)>=10)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.month).toBe("number");
                expect(typeof o.total).toBe("number");
                expect(typeof o.qty).toBe("number");
            }
        });
    });
    describe("PARAMETERS", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const paramObj = { now: (new Date()).addYears(-1) };
            const parameter = db.orders.parameter({ paramObj }).where((o) => o.OrderDate < paramObj.now);
            const results = await parameter.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[OrderDate]<@param0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map<string, any>([["param0", paramObj.now]]));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should be computed in application", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const paramObj = { now: new Date() };
            const parameter = db.orders.parameter({ paramObj }).where((o) => o.OrderDate.getDate() !== paramObj.now.getDate());
            const results = await parameter.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE (DAY([entity0].[OrderDate])<>@param0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map<string, any>([["param0", paramObj.now.getDate()]]));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should be computed in query", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const parameter = db.orders.where((o) => o.OrderDate < new Date());
            const results = await parameter.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[OrderDate]<getdate())");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should pass function to query", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const fn = (o: Order) => o.TotalAmount / o.OrderDetails.count();
            const parameter = await db.orders.parameter({ fn }).select((o) => fn(o));
            const results = await parameter.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t([entity0].[TotalAmount]/[entity1].[column0]) AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity1].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("should pass function with parameter", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const multi = 10;
            const fn = (o: Order) => o.TotalAmount * multi / o.OrderDetails.count();
            const parameter = await db.orders.parameter({ fn, multi }).select((o) => fn(o));
            const results = await parameter.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t(([entity0].[TotalAmount]*@param0)/[entity1].[column0]) AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity1].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity0].[OrderId]=[entity1].[OrderId])");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map<string, any>([["param0", 10]]));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("should re-build query based on Function type parameter", async () => {
            let fn = (o: number) => o + 1;
            for (let i = 0; i < 2; i++) {
                fn = i % 2 === 0 ? (o: number) => o + 1 : (o: number) => o - 1;
                const where = await db.orders.parameter({ fn })
                    .select((o) => fn(o.TotalAmount));
                db.connection = await db.getConnection();
                const spy = vi.spyOn(db.connection, "query");

                await where.toArray();
                if (i % 2 === 0) {
                    const param = spy.mock.calls[0][0] as unknown as IQuery;
                    expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t([entity0].[TotalAmount]+1) AS [column0]\nFROM [Orders] AS [entity0]");
                    expect(param.type).toBe(QueryType.DQL);
                    expect(param.parameters).toEqual(new Map());
                }
                else {

                    const param = spy.mock.calls[0][0] as unknown as IQuery;
                    expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t([entity0].[TotalAmount]-1) AS [column0]\nFROM [Orders] AS [entity0]");
                    expect(param.type).toBe(QueryType.DQL);
                    expect(param.parameters).toEqual(new Map());
                }
            }
        });
        it("should support null value parameter", async () => {
            let spy = vi.spyOn(db.connection, "query");

            let dd = new Date();
            let avg = db.orders.parameter({ dd }).where((o) => o.OrderDate === dd);
            let results = await avg.toArray();

            expect(spy).toHaveBeenCalledOnce();
            let param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[OrderDate]=@param0)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map<string, any>([["param0", dd]]));

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }

            spy.mockRestore();
            db.connection = await db.getConnection();
            spy = vi.spyOn(db.connection, "query");

            dd = null;
            avg = db.orders.parameter({ dd }).where((o) => o.OrderDate === dd);
            results = await avg.toArray();

            expect(spy).toHaveBeenCalledOnce();
            param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[OrderDate] IS NULL)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map<string, any>([["param0", dd]]));

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("SUBQUERY", () => {
        // possible used CTE
        it("should work in where (CONTAINS)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orderDetails.where((o) => o.quantity > 5).asSubquery();
            const subQuery = db.orders.parameter({ ad }).where((o) => ad.select((od) => od.OrderId).contains(o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE [entity0].[OrderId] IN (\n\tSELECT DISTINCT [entity1].[OrderId]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>5))\n)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in where (Aggregate comparation)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orderDetails.where((o) => o.quantity > 5).asSubquery();
            const subQuery = db.orders.parameter({ ad }).where((o) => ad.where((od) => od.OrderId === o.OrderId).max((o) => o.quantity) > 10);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMAX([entity1].[Quantity]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>5))\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity1].[column0]>10)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in where (ANY)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orderDetails.where((o) => o.quantity > 5).asSubquery();
            const subQuery = db.orders.parameter({ ad }).where((o) => ad.any((od) => od.OrderId === o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\t1 AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>5))\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity1].[column0] IS NOT NULL)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should determine whether where filter goes to join expression or not", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orderDetails.asSubquery();
            const subQuery = db.orders.parameter({ ad }).where((o) => ad.where((od) => od.quantity > 1 && od.OrderId === o.OrderId).count() > 1);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity1].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>1))\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity1].[column0]>1)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in select (Relation/Array)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orderDetails.asSubquery();
            const subQuery = db.orders.parameter({ ad }).where((o) => o.TotalAmount <= 20000).select((o) => ({
                orderDetails: ad.where((od) => od.OrderId === o.OrderId).toArray()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId]\n\tFROM [Orders] AS [entity0]\n\tWHERE ([entity0].[TotalAmount]<=20000)\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity1].[isDeleted]=0);\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[TotalAmount]<=20000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.orderDetails).toBeInstanceOf(Array);
                expect(o.orderDetails.length).toBeGreaterThan(0);
                for (const od of o.orderDetails) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("should work in select (Aggregate)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orderDetails.asSubquery();
            const subQuery = db.orders.parameter({ ad }).where((o) => o.TotalAmount <= 20000).select((o) => ({
                orderDetails: ad.where((od) => od.OrderId === o.OrderId).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity1].[column0] AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity1].[OrderDetailId]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[isDeleted]=0)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity0].[TotalAmount]<=20000)");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.orderDetails).toBe("number");
            }
        });
        it("should work in select (Count SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]);
            const ads = ad.asSubquery();
            const subQuery = ad.parameter({ ads }).select((o) => ({
                TotalAmount: o.TotalAmount,
                Count: ads.where((od) => o.TotalAmount >= od.TotalAmount).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount] AS [column0],\n\t[entity2].[column2] AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tSUM([entity1].[column1]) AS [column2]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[TotalAmount],\n\t\t\tCOUNT([entity1].[OrderId]) AS [column1]\n\t\tFROM [Orders] AS [entity1]\n\t\tGROUP BY [entity1].[TotalAmount]\n\t) AS [entity1]\n\t\tON ([entity2].[TotalAmount]>=[entity1].[TotalAmount])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[TotalAmount] ASC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.Count).toBe("number");
            }
        });
        it("should work in select (Sum SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.OrderDate, "DESC"]);
            const ads = ad.asSubquery();
            const subQuery = ad.take(10).parameter({ ads }).select((o) => ({
                OrderId: o.OrderId,
                TotalAmount: o.TotalAmount,
                Accumulated: ads.where((od) => od.OrderDate >= o.OrderDate).sum((o) => o.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT TOP 10 [entity0].[OrderId],\n\t[entity0].[OrderId] AS [column0],\n\t[entity0].[TotalAmount] AS [column1],\n\t[entity2].[column3] AS [column4]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tSUM([entity1].[column2]) AS [column3]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[OrderDate],\n\t\t\tSUM([entity1].[TotalAmount]) AS [column2]\n\t\tFROM [Orders] AS [entity1]\n\t\tGROUP BY [entity1].[OrderDate]\n\t) AS [entity1]\n\t\tON ([entity1].[OrderDate]>=[entity2].[OrderDate])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[OrderDate] DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.Accumulated).toBe("number");
                expect(o.OrderId).toBeInstanceOf(Uuid);
            }
        });
        it("should work in select (Any SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]);
            const ads = ad.asSubquery();
            const subQuery = ad.take(10).parameter({ ads }).select((o) => ({
                TotalAmount: o.TotalAmount,
                IsNotLowest: ads.where((od) => o.TotalAmount > od.TotalAmount).any()
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT TOP 10 [entity0].[OrderId],\n\t[entity0].[TotalAmount] AS [column0],\n\t(\n\tCASE WHEN (([entity2].[column2]=1)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\t(\n\t\tCASE WHEN ((SUM([entity1].[column1]) IS NOT NULL)) \n\t\tTHEN 1\n\t\tELSE 0\n\t\tEND\n\t) AS [column2]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[TotalAmount],\n\t\t\t1 AS [column1]\n\t\tFROM [Orders] AS [entity1]\n\t\tGROUP BY [entity1].[TotalAmount]\n\t) AS [entity1]\n\t\tON ([entity2].[TotalAmount]>[entity1].[TotalAmount])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[TotalAmount] ASC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.IsNotLowest).toBe("boolean");
            }
        });
        it("should work in select (All SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.TotalAmount, "DESC"]);
            const ads = ad.asSubquery();
            const subQuery = ad.take(10).parameter({ ads }).select((o) => ({
                TotalAmount: o.TotalAmount,
                IsHighest: ads.all((od) => o.TotalAmount >= od.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT TOP 10 [entity0].[OrderId],\n\t[entity0].[TotalAmount] AS [column0],\n\t(\n\tCASE WHEN (([entity2].[column2]=1)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\t(\n\t\tCASE WHEN ((SUM([entity1].[column1]) IS NULL)) \n\t\tTHEN 1\n\t\tELSE 0\n\t\tEND\n\t) AS [column2]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[TotalAmount],\n\t\t\t0 AS [column1]\n\t\tFROM [Orders] AS [entity1]\n\t\tGROUP BY [entity1].[TotalAmount]\n\t) AS [entity1]\n\t\tON NOT(\n\t\tNOT(\n\t\t\t([entity2].[TotalAmount]>=[entity1].[TotalAmount])\n\t\t)\n\t)\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[TotalAmount] DESC");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.IsHighest).toBe("boolean");
            }
        });
    });
    describe("ARRAY PARAMETER", () => {
        it("should work in where (CONTAINS)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad: OrderDetail[] = [
                new OrderDetail({ OrderDetailId: "648F644D-EB4A-4200-91AD-13694EEF1CAB", OrderId: "C7438661-DD97-4099-A370-053A72F4C706", ProductId: "BE019609-99E0-4EF5-85BB-AD90DC302E58", name: "Product 1", quantity: 1, CreatedDate: "2017-02-22T23:03:39.737Z", isDeleted: false })
            ];
            // specify item type in case array did not have any item.
            const subQuery = db.orders.parameter({
                ad, ad_itemtype: {
                    constructor: OrderDetail,
                    OrderId: Uuid
                }
            }).where((o) => ad.select((od) => od.OrderId).contains(o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ad1\n(\n\t[__index] decimal(18, 0),\n\t[OrderId] uniqueidentifier\n);\n\nINSERT INTO #ad1([__index], [OrderId]) VALUES\n\t(0,'C7438661-DD97-4099-A370-053A72F4C706');\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE [entity0].[OrderId] IN (\n\tSELECT DISTINCT [entity1].[OrderId]\n\tFROM #ad1 AS [entity1]\n);\n\nDROP TABLE #ad1");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(new Map([["param0", ad]]));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in where (Aggregate comparation)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad: OrderDetail[] = [
                new OrderDetail({ OrderDetailId: "648F644D-EB4A-4200-91AD-13694EEF1CAB", OrderId: "C7438661-DD97-4099-A370-053A72F4C706", ProductId: "BE019609-99E0-4EF5-85BB-AD90DC302E58", name: "Product 1", quantity: 1, CreatedDate: "2017-02-22T23:03:39.737Z", isDeleted: false })
            ];
            const subQuery = db.orders.parameter({ ad }).where((o) => ad.where((od) => od.OrderId === o.OrderId).max((o) => o.quantity) > 10);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ad1\n(\n\t[__index] decimal(18, 0),\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[name] nvarchar(255),\n\t[quantity] decimal(18, 0),\n\t[CreatedDate] nvarchar(255),\n\t[isDeleted] nvarchar(255)\n);\n\nINSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES\n\t(0,'648F644D-EB4A-4200-91AD-13694EEF1CAB','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E58','Product 1',1,'2017-02-22T23:03:39.737Z',0);\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMAX([entity1].[quantity]) AS [column0]\n\tFROM #ad1 AS [entity1]\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity1].[column0]>10);\n\nDROP TABLE #ad1");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(new Map([["param0", ad]]));

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in where (ANY)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad: OrderDetail[] = [
                new OrderDetail({ OrderDetailId: "648F644D-EB4A-4200-91AD-13694EEF1CAB", OrderId: "C7438661-DD97-4099-A370-053A72F4C706", ProductId: "BE019609-99E0-4EF5-85BB-AD90DC302E58", name: "Product 1", quantity: 1, CreatedDate: "2017-02-22T23:03:39.737Z", isDeleted: false })
            ];
            const subQuery = db.orders.parameter({ ad }).where((o) => ad.any((od) => od.OrderId === o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ad1\n(\n\t[__index] decimal(18, 0),\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[name] nvarchar(255),\n\t[quantity] decimal(18, 0),\n\t[CreatedDate] nvarchar(255),\n\t[isDeleted] nvarchar(255)\n);\n\nINSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES\n\t(0,'648F644D-EB4A-4200-91AD-13694EEF1CAB','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E58','Product 1',1,'2017-02-22T23:03:39.737Z',0);\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\t1 AS [column0]\n\tFROM #ad1 AS [entity1]\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity1].[column0] IS NOT NULL);\n\nDROP TABLE #ad1");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(new Map([["param0", ad]]));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should determine whether where filter goes to join expression or not", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad: OrderDetail[] = [
                new OrderDetail({ OrderDetailId: "648F644D-EB4A-4200-91AD-13694EEF1CAB", OrderId: "C7438661-DD97-4099-A370-053A72F4C706", ProductId: "BE019609-99E0-4EF5-85BB-AD90DC302E58", name: "Product 1", quantity: 1, CreatedDate: "2017-02-22T23:03:39.737Z", isDeleted: false })
            ];
            const subQuery = db.orders.parameter({ ad }).where((o) => ad.where((od) => od.quantity > 1 && od.OrderId === o.OrderId).count() > 1);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ad1\n(\n\t[__index] decimal(18, 0),\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[name] nvarchar(255),\n\t[quantity] decimal(18, 0),\n\t[CreatedDate] nvarchar(255),\n\t[isDeleted] nvarchar(255)\n);\n\nINSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES\n\t(0,'648F644D-EB4A-4200-91AD-13694EEF1CAB','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E58','Product 1',1,'2017-02-22T23:03:39.737Z',0);\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity1].[__index]) AS [column0]\n\tFROM #ad1 AS [entity1]\n\tWHERE ([entity1].[quantity]>1)\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity1].[column0]>1);\n\nDROP TABLE #ad1");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(new Map([["param0", ad]]));

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in select (Relation/Array)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad: OrderDetail[] = [
                new OrderDetail({ OrderDetailId: "E4EB9FA2-C834-40BA-A1C7-8109EEFD0FC6", OrderId: "C7438661-DD97-4099-A370-053A72F4C706", ProductId: "BE019609-99E0-4EF5-85BB-AD90DC302E59", name: "Product 2", quantity: 2, CreatedDate: "2017-02-22T23:03:39.737Z", isDeleted: false })
            ];
            const subQuery = db.orders.parameter({ ad }).where((o) => o.TotalAmount <= 20000).select((o) => ({
                orderDetails: ad.where((od) => od.OrderId === o.OrderId).toArray()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ad1\n(\n\t[__index] decimal(18, 0),\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[name] nvarchar(255),\n\t[quantity] decimal(18, 0),\n\t[CreatedDate] nvarchar(255),\n\t[isDeleted] nvarchar(255)\n);\n\nINSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES\n\t(0,'E4EB9FA2-C834-40BA-A1C7-8109EEFD0FC6','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E59','Product 2',2,'2017-02-22T23:03:39.737Z',0);\n\nSELECT [entity1].[__index],\n\t[entity1].[OrderId],\n\t[entity1].[OrderDetailId],\n\t[entity1].[ProductId],\n\t[entity1].[name],\n\t[entity1].[quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM #ad1 AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderId]\n\tFROM [Orders] AS [entity0]\n\tWHERE ([entity0].[TotalAmount]<=20000)\n) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);\n\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[TotalAmount]<=20000);\n\nDROP TABLE #ad1");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(new Map([["param0", ad]]));

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o.orderDetails).toBeInstanceOf(Array);
                for (const od of o.orderDetails) {
                    expect(od).toBeInstanceOf(OrderDetail);
                }
            }
        });
        it("should work in select (Aggregate)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad: OrderDetail[] = [
                new OrderDetail({ OrderDetailId: "E4EB9FA2-C834-40BA-A1C7-8109EEFD0FC6", OrderId: "C7438661-DD97-4099-A370-053A72F4C706", ProductId: "BE019609-99E0-4EF5-85BB-AD90DC302E59", name: "Product 2", quantity: 2, CreatedDate: "2017-02-22T23:03:39.737Z", isDeleted: false })
            ];
            const subQuery = db.orders.parameter({ ad }).where((o) => o.TotalAmount <= 20000).select((o) => ({
                orderDetails: ad.where((od) => od.OrderId === o.OrderId).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ad1\n(\n\t[__index] decimal(18, 0),\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[name] nvarchar(255),\n\t[quantity] decimal(18, 0),\n\t[CreatedDate] nvarchar(255),\n\t[isDeleted] nvarchar(255)\n);\n\nINSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES\n\t(0,'E4EB9FA2-C834-40BA-A1C7-8109EEFD0FC6','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E59','Product 2',2,'2017-02-22T23:03:39.737Z',0);\n\nSELECT [entity0].[OrderId],\n\t[entity1].[column0] AS [column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT([entity1].[__index]) AS [column0]\n\tFROM #ad1 AS [entity1]\n\tGROUP BY [entity1].[OrderId]\n) AS [entity1]\n\tON ([entity1].[OrderId]=[entity0].[OrderId])\nWHERE ([entity0].[TotalAmount]<=20000);\n\nDROP TABLE #ad1");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(new Map([["param0", ad]]));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.orderDetails).toBe("number");
            }
        });
        it("should work in select (Count SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]);
            const ads = [
                new Order({ OrderId: "57CE0F63-AFD3-4A04-A07E-0392C87AE381", TotalAmount: 13200, OrderDate: "2017-01-19T02:08:41.530Z" }),
                new Order({ OrderId: "C7438661-DD97-4099-A370-053A72F4C706", TotalAmount: 71000, OrderDate: "2017-02-22T23:03:39.447Z" })
            ];
            const subQuery = ad.parameter({ ads }).select((o) => ({
                TotalAmount: o.TotalAmount,
                Count: ads.where((od) => o.TotalAmount >= od.TotalAmount).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ads1\n(\n\t[__index] decimal(18, 0),\n\t[OrderId] nvarchar(255),\n\t[TotalAmount] decimal(18, 0),\n\t[OrderDate] nvarchar(255)\n);\n\nINSERT INTO #ads1([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES\n\t(0,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z'),\n\t(1,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z');\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount] AS [column0],\n\t[entity2].[column2] AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tSUM([entity1].[column1]) AS [column2]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[TotalAmount],\n\t\t\tCOUNT([entity1].[__index]) AS [column1]\n\t\tFROM #ads1 AS [entity1]\n\t\tGROUP BY [entity1].[TotalAmount]\n\t) AS [entity1]\n\t\tON ([entity2].[TotalAmount]>=[entity1].[TotalAmount])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[TotalAmount] ASC;\n\nDROP TABLE #ads1");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(new Map([["param0", ads]]));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.Count).toBe("number");
            }
        });
        it("should work in select (Sum SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.OrderDate, "DESC"]);
            const ads = [
                new Order({ OrderId: "C7438661-DD97-4099-A370-053A72F4C706", TotalAmount: 71000, OrderDate: "2017-02-22T23:03:39.447Z" }),
                new Order({ OrderId: "57CE0F63-AFD3-4A04-A07E-0392C87AE381", TotalAmount: 13200, OrderDate: "2017-01-19T02:08:41.530Z" })
            ];
            const subQuery = ad.take(10).parameter({ ads }).select((o) => ({
                OrderId: o.OrderId,
                TotalAmount: o.TotalAmount,
                Accumulated: ads.where((od) => od.OrderDate >= o.OrderDate).sum((o) => o.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ads2\n(\n\t[__index] decimal(18, 0),\n\t[OrderId] nvarchar(255),\n\t[TotalAmount] decimal(18, 0),\n\t[OrderDate] nvarchar(255)\n);\n\nINSERT INTO #ads2([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES\n\t(0,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z'),\n\t(1,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z');\n\nSELECT TOP 10 [entity0].[OrderId],\n\t[entity0].[OrderId] AS [column0],\n\t[entity0].[TotalAmount] AS [column1],\n\t[entity2].[column3] AS [column4]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\tSUM([entity1].[column2]) AS [column3]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[OrderDate],\n\t\t\tSUM([entity1].[TotalAmount]) AS [column2]\n\t\tFROM #ads2 AS [entity1]\n\t\tGROUP BY [entity1].[OrderDate]\n\t) AS [entity1]\n\t\tON ([entity1].[OrderDate]>=[entity2].[OrderDate])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[OrderDate] DESC;\n\nDROP TABLE #ads2");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(expect.objectContaining(new Map()));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.OrderId).toBeInstanceOf(Uuid);
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.Accumulated).toBe("number");
            }
        });
        it("should work in select (Any SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.TotalAmount, "ASC"]);
            const ads = [
                new Order({ OrderId: "57CE0F63-AFD3-4A04-A07E-0392C87AE381", TotalAmount: 13200, OrderDate: "2017-01-19T02:08:41.530Z" }),
                new Order({ OrderId: "C7438661-DD97-4099-A370-053A72F4C706", TotalAmount: 71000, OrderDate: "2017-02-22T23:03:39.447Z" })
            ];
            const subQuery = ad.take(10).parameter({ ads }).select((o) => ({
                TotalAmount: o.TotalAmount,
                IsNotLowest: ads.where((od) => o.TotalAmount > od.TotalAmount).any()
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ads2\n(\n\t[__index] decimal(18, 0),\n\t[OrderId] nvarchar(255),\n\t[TotalAmount] decimal(18, 0),\n\t[OrderDate] nvarchar(255)\n);\n\nINSERT INTO #ads2([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES\n\t(0,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z'),\n\t(1,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z');\n\nSELECT TOP 10 [entity0].[OrderId],\n\t[entity0].[TotalAmount] AS [column0],\n\t(\n\tCASE WHEN (([entity2].[column2]=1)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\t(\n\t\tCASE WHEN ((SUM([entity1].[column1]) IS NOT NULL)) \n\t\tTHEN 1\n\t\tELSE 0\n\t\tEND\n\t) AS [column2]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[TotalAmount],\n\t\t\t1 AS [column1]\n\t\tFROM #ads2 AS [entity1]\n\t\tGROUP BY [entity1].[TotalAmount]\n\t) AS [entity1]\n\t\tON ([entity2].[TotalAmount]>[entity1].[TotalAmount])\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[TotalAmount] ASC;\n\nDROP TABLE #ads2");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(expect.objectContaining(new Map<string, any>([["param0", 10]])));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.IsNotLowest).toBe("boolean");
            }
        });
        it("should work in select (All SubQuery)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const ad = db.orders.orderBy([(o) => o.TotalAmount, "DESC"]);
            const ads = [
                new Order({ OrderId: "C7438661-DD97-4099-A370-053A72F4C706", TotalAmount: 71000, OrderDate: "2017-02-22T23:03:39.447Z" }),
                new Order({ OrderId: "57CE0F63-AFD3-4A04-A07E-0392C87AE381", TotalAmount: 13200, OrderDate: "2017-01-19T02:08:41.530Z" })
            ];
            const subQuery = ad.take(10).parameter({ ads }).select((o) => ({
                TotalAmount: o.TotalAmount,
                IsHighest: ads.all((od) => o.TotalAmount >= od.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("CREATE TABLE #ads2\n(\n\t[__index] decimal(18, 0),\n\t[OrderId] nvarchar(255),\n\t[TotalAmount] decimal(18, 0),\n\t[OrderDate] nvarchar(255)\n);\n\nINSERT INTO #ads2([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES\n\t(0,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z'),\n\t(1,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z');\n\nSELECT TOP 10 [entity0].[OrderId],\n\t[entity0].[TotalAmount] AS [column0],\n\t(\n\tCASE WHEN (([entity2].[column2]=1)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [column3]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderId],\n\t\t(\n\t\tCASE WHEN ((SUM([entity1].[column1]) IS NULL)) \n\t\tTHEN 1\n\t\tELSE 0\n\t\tEND\n\t) AS [column2]\n\tFROM [Orders] AS [entity2]\n\tLEFT JOIN (\n\t\tSELECT [entity1].[TotalAmount],\n\t\t\t0 AS [column1]\n\t\tFROM #ads2 AS [entity1]\n\t\tGROUP BY [entity1].[TotalAmount]\n\t) AS [entity1]\n\t\tON NOT(\n\t\tNOT(\n\t\t\t([entity2].[TotalAmount]>=[entity1].[TotalAmount])\n\t\t)\n\t)\n\tGROUP BY [entity2].[OrderId]\n) AS [entity2]\n\tON ([entity2].[OrderId]=[entity0].[OrderId])\nORDER BY [entity0].[TotalAmount] DESC;\n\nDROP TABLE #ads2");
            expect(param.type).toBe(QueryType.DDL | QueryType.DML | QueryType.DQL);
            expect(param.parameters).toEqual(expect.objectContaining(new Map<string, any>([["param0", 10]])));

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o.TotalAmount).toBe("number");
                expect(typeof o.IsHighest).toBe("boolean");
            }
        });
    });
    describe("QUERY OPTION", () => {
        it("should show soft deleted", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const softDeleteQuery = db.orderDetails.option({ includeSoftDeleted: true });
            const results = await softDeleteQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]");
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetail);
            }
        });
        it("should cache query with different key", () => {
            const queryExcludeSoftDeleted = db.orderDetails.toString();
            const queryIncludeSoftDeleted = db.orderDetails.option({ includeSoftDeleted: true }).toString();

            expect(queryExcludeSoftDeleted).not.toBe(queryIncludeSoftDeleted);
        });
    });
    // describe("TERNARY OPERATOR", () => {
    //     // TODO
    //     it("test 1", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.select(o => ({
    //             item: o.TotalAmount > 20000 ? 20000 : o.TotalAmount
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 2", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.select(o => ({
    //             item: o.quantity === 1 ? o.Order : null
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 3", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.select(o => ({
    //             item: o.quantity === 1 ? o.Order : { OrderId: o.OrderId }
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 4", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.select(o => ({
    //             item: o.OrderDate.getDate() === 1 ? o.OrderDetails : null
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 5", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.select(o => ({
    //             item: o.OrderDate.getDate() === 1 ? o.OrderDetails.first() : o.OrderDate
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 6", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.select(o => ({
    //             item: o.quantity === 1 ? o.OrderDetailProperties : o.Product
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 7", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.select(o => ({
    //             item: o.OrderDetails
    //         })).select(o => o.item.count());
    //         const results = await ternary.toArray();
    //     });
    // });
});

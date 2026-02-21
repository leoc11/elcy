import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryType } from "../../../src/Common/Enum";
import { Uuid } from "../../../src/Data/Uuid";
import { IEntityMetaData } from "../../../src/MetaData/Interface/IEntityMetaData";
import { mockContext } from "../../Mock/MockContext";
import { IQuery } from "../../../src/Query/IQuery";
import { Order, OrderDetail, OrderDetailProperty, Product } from "../../Common/Model";
import { MyDb } from "../../Common/MyDb";
import { DbFunction } from "../../../src/Query/DbFunction";
import { Enumerable } from "@elcy/enumerable";
import { getEntityMetadata } from "src/MetaData/MetaDataMapper";
// import { MssqlDriver } from "elcy-tedious/MssqlDriver";

const orderDetailMeta = getEntityMetadata(OrderDetail);
const orderMeta = getEntityMetadata(Order) as IEntityMetaData;

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
    describe("LOADS", async () => {
        it("should eager load list navigation property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const include = db.orders.loads((o) => o.OrderDetails);
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results.length).toBeGreaterThan(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
                const properties = orderMeta.columns.map((o) => o.propertyName);
                for (const property of properties) {
                    expect(o).toHaveProperty(property as any);
                    expect(o[property]).not.toBeNull();
                }
                expect(o.OrderDetails).toBeInstanceOf(Array);
                for (const od of o.OrderDetails) {
                    expect(od).toBeInstanceOf(OrderDetail);
                    const odProps = orderDetailMeta.columns.map((o) => o.propertyName);
                    for (const prop of odProps) {
                        expect(od).toHaveProperty(prop as any);
                        expect(od[prop]).not.toBeNull();
                    }
                }
            }
        });
        it("should support nested include", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const include = db.orders.loads((o) => o.OrderDetails.map((od) => od.Product));
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[ProductId],
	[entity2].[Price]
FROM [Products] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[ProductId],
		[entity1].[OrderId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1] ON ([entity1].[ProductId]=[entity2].[ProductId]);

SELECT [entity1].[OrderDetailId],
	[entity1].[ProductId],
	[entity1].[OrderId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
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

            const include = db.orderDetails.loads((o) => o.Order);
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderDetailId],
		[entity0].[OrderId],
		[entity0].[ProductId],
		[entity0].[ProductName],
		[entity0].[Quantity],
		[entity0].[CreatedDate],
		[entity0].[isDeleted]
	FROM [OrderDetails] AS [entity0]
	WHERE ([entity0].[isDeleted]=0)
) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId]);

SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)`
            );
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

            const include = db.orderDetails.loads((o) => o.Order, (o) => o.Product);
            const results = await include.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderDetailId],
		[entity0].[OrderId],
		[entity0].[ProductId],
		[entity0].[ProductName],
		[entity0].[Quantity],
		[entity0].[CreatedDate],
		[entity0].[isDeleted]
	FROM [OrderDetails] AS [entity0]
	WHERE ([entity0].[isDeleted]=0)
) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId]);

SELECT [entity2].[ProductId],
	[entity2].[Price]
FROM [Products] AS [entity2]
INNER JOIN (
	SELECT [entity0].[OrderDetailId],
		[entity0].[OrderId],
		[entity0].[ProductId],
		[entity0].[ProductName],
		[entity0].[Quantity],
		[entity0].[CreatedDate],
		[entity0].[isDeleted]
	FROM [OrderDetails] AS [entity0]
	WHERE ([entity0].[isDeleted]=0)
) AS [entity0] ON ([entity0].[ProductId]=[entity2].[ProductId]);

SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)`
            );
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
    });
    describe("PROJECT", async () => {
        it("should project specific property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const projection = db.orders.project((o) => o.TotalAmount);
            const results = await projection.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount]
FROM [Orders] AS [entity0]`
            );
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
    describe("MAP", async () => {
        it("should return specific property", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orders.map((o) => o.OrderDate);
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
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

            const select = db.orders.map((o) => ({
                date: o.OrderDate,
                amount: o.TotalAmount + 1.2
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[OrderDate] AS [column0],
	([entity0].[TotalAmount]+1.2) AS [column1]
FROM [Orders] AS [entity0]`
            );
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

            const select = db.orderDetails.map((o) => ({
                date: o.Order.OrderDate
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity1].[OrderDate] AS [column0]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Orders] AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity0].[isDeleted]=0)`
            );
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

            const select = db.orders.map((o) => ({
                ods: o.OrderDetails
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`
            );
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

            const select = db.orderDetails.map((o) => ({
                prod: o.Product
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[ProductId],
	[entity1].[Price]
FROM [Products] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderDetailId],
		[entity0].[ProductId]
	FROM [OrderDetails] AS [entity0]
	WHERE ([entity0].[isDeleted]=0)
) AS [entity0] ON ([entity0].[ProductId]=[entity1].[ProductId]);

SELECT [entity0].[OrderDetailId],
	[entity0].[ProductId]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)`
            );
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

            const select = db.orders.map((o) => ({
                simpleOrderDetails: o.OrderDetails.map((od) => ({
                    name: od.name
                })).toArray()
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductName] AS [column0]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`
            );
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

            const select = db.orders.map((o) => ({
                simpleOrderDetails: o.OrderDetails.map((od) => ({
                    prod: od.Product
                })).toArray()
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[ProductId],
	[entity2].[Price]
FROM [Products] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[ProductId],
		[entity1].[OrderId]
	FROM [OrderDetails] AS [entity1]
	INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1] ON ([entity1].[ProductId]=[entity2].[ProductId]);

SELECT [entity1].[OrderDetailId],
	[entity1].[ProductId],
	[entity1].[OrderId]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`
            );
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

            const select = db.orders.map((o) => ({
                simpleOrderDetails: o.OrderDetails.map((od) => ({
                    od: od,
                    Price: od.Product.Price
                })).toArray()
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderDetailId],
	[entity2].[OrderId],
	[entity2].[ProductId],
	[entity2].[ProductName],
	[entity2].[Quantity],
	[entity2].[CreatedDate],
	[entity2].[isDeleted]
FROM [OrderDetails] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity3].[Price] AS [column0]
	FROM [OrderDetails] AS [entity1]
	LEFT JOIN [Products] AS [entity3]
		ON ([entity1].[ProductId]=[entity3].[ProductId])
	INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1] ON ([entity2].[OrderDetailId]=[entity1].[OrderDetailId])
WHERE ([entity2].[isDeleted]=0);

SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity3].[Price] AS [column0]
FROM [OrderDetails] AS [entity1]
LEFT JOIN [Products] AS [entity3]
	ON ([entity1].[ProductId]=[entity3].[ProductId])
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`
            );
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

            const select = db.orders.map((o) => o.OrderDetails);
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0)`
            );
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

            const select = db.orders.map((o) => ({
                sum: o.OrderDetails.filter((p) => p.quantity > 2).sum((o) => o.quantity),
                ods: o.OrderDetails.filter((p) => p.quantity <= 1)
            }));
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderDetailId],
	[entity2].[OrderId],
	[entity2].[ProductId],
	[entity2].[ProductName],
	[entity2].[Quantity],
	[entity2].[CreatedDate],
	[entity2].[isDeleted]
FROM [OrderDetails] AS [entity2]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity1].[column0] AS [column1]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity1].[OrderId],
			SUM([entity1].[Quantity]) AS [column0]
		FROM [OrderDetails] AS [entity1]
		WHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>2))
		GROUP BY [entity1].[OrderId]
	) AS [entity1]
		ON ([entity0].[OrderId]=[entity1].[OrderId])
) AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId])
WHERE (([entity2].[isDeleted]=0) AND ([entity2].[Quantity]<=1));

SELECT [entity0].[OrderId],
	[entity1].[column0] AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		SUM([entity1].[Quantity]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>2))
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
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

            const isAllEmpty = results.every((o) => !o.ods.some(() => true));
            expect(isAllEmpty).not.true;
        });
        it("should work in chain", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const select = db.orderDetails.map((o) => ({
                test: o.Order.TotalAmount
            })).map((o) => ({
                test3: o.test
            })).filter((o) => o.test3 > 10000);
            const results = await select.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity1].[TotalAmount] AS [column0]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Orders] AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE (([entity0].[isDeleted]=0) AND ([entity1].[TotalAmount]>10000))`
            );
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

            const order = db.orders.flatMap((o) => o.OrderDetails);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0)`
            );
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

            const order = db.orders.flatMap((o) => o.OrderDetails.map((o) => o.Product));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[ProductId],
	[entity2].[Price]
FROM [Products] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[ProductId],
		[entity1].[OrderId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
INNER JOIN [Orders] AS [entity0]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
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

            const order = db.orders.flatMap((o) => o.OrderDetails.map((o) => o.Product.Price));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[ProductId],
	[entity2].[Price]
FROM [Products] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[ProductId],
		[entity1].[OrderId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
INNER JOIN [Orders] AS [entity0]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
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

            const order = db.orders.filter((o) => o.TotalAmount > 10000).flatMap((o) => o.OrderDetails.map((o) => o.OrderDetailProperties));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderDetailPropertyId],
	[entity2].[OrderDetailId],
	[entity2].[Name],
	[entity2].[Amount]
FROM [OrderDetailProperties] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity0].[TotalAmount],
		[entity0].[OrderDate]
	FROM [Orders] AS [entity0]
	WHERE ([entity0].[TotalAmount]>10000)
) AS [entity0]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(Array);
            }

            const isAllEmpty = results.every((o) => !o.some(() => true));
            expect(isAllEmpty).toBe(false);
        });
        it("should worked in chain", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const order = db.orders.flatMap((o) => o.OrderDetails).flatMap((o) => o.OrderDetailProperties);
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderDetailPropertyId],
	[entity2].[OrderDetailId],
	[entity2].[Name],
	[entity2].[Amount]
FROM [OrderDetailProperties] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	INNER JOIN [Orders] AS [entity0]
		ON ([entity0].[OrderId]=[entity1].[OrderId])
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])`
            );
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

            const order = db.orders.flatMap((o) => o.OrderDetails.flatMap((o) => o.OrderDetailProperties));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderDetailPropertyId],
	[entity2].[OrderDetailId],
	[entity2].[Name],
	[entity2].[Amount]
FROM [OrderDetailProperties] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])
INNER JOIN [Orders] AS [entity0]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            for (const o of results) {
                expect(o).toBeInstanceOf(OrderDetailProperty);
            }
        });
    });
    describe("FILTER", async () => {
        it("should add where clause", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const where = db.orders.filter((o) => o.TotalAmount <= 10000);
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE ([entity0].[TotalAmount]<=10000)`
            );
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

            const where = db.orders.loads((o) => o.OrderDetails.filter((od) => od.Product.Price <= 15000));
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE (([entity1].[isDeleted]=0) AND ([entity2].[Price]<=15000));

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
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

            const where = db.orders.map((o) => ({
                ods: o.OrderDetails.filter((od) => od.Product.Price <= 15000)
            }));
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE (([entity1].[isDeleted]=0) AND ([entity2].[Price]<=15000));

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`
            );
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

            const where = db.orderDetails.filter((o) => o.Product.Price <= 15000).filter((o) => DbFunction.like(o.name, "%a%"));
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Products] AS [entity1]
	ON ([entity0].[ProductId]=[entity1].[ProductId])
WHERE ((([entity0].[isDeleted]=0) AND ([entity1].[Price]<=15000)) AND ([entity0].[ProductName] LIKE '%a%'))`
            );
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

            const where = db.orders.filter((o) => o.TotalAmount > 20000).groupBy((o) => o.OrderDate)
                .filter((o) => o.count() >= 1)
                .map((o) => o.key).filter((o) => o.getDate() > 15).orderBy([(o) => o]);
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE ([entity0].[TotalAmount]>20000)
GROUP BY [entity0].[OrderDate]
HAVING ((COUNT([entity0].[OrderId])>=1) AND (DAY([entity0].[OrderDate])>15))
ORDER BY [entity0].[OrderDate] ASC`
            );
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

            const where = db.orderDetailProperties.filter((o) => o.OrderDetail.Order.TotalAmount > 10000);
            const results = await where.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailPropertyId],
	[entity0].[OrderDetailId],
	[entity0].[Name],
	[entity0].[Amount]
FROM [OrderDetailProperties] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
LEFT JOIN [Orders] AS [entity2]
	ON ([entity1].[OrderId]=[entity2].[OrderId])
WHERE ([entity2].[TotalAmount]>10000)`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
ORDER BY [entity0].[TotalAmount] DESC`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Products] AS [entity1]
	ON ([entity0].[ProductId]=[entity1].[ProductId])
WHERE ([entity0].[isDeleted]=0)
ORDER BY [entity1].[Price] DESC`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Products] AS [entity1]
	ON ([entity0].[ProductId]=[entity1].[ProductId])
WHERE ([entity0].[isDeleted]=0)
ORDER BY ([entity0].[Quantity]*[entity1].[Price]) DESC`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Products] AS [entity1]
	ON ([entity0].[ProductId]=[entity1].[ProductId])
WHERE ([entity0].[isDeleted]=0)
ORDER BY [entity0].[Quantity] ASC, [entity1].[Price] DESC`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Products] AS [entity1]
	ON ([entity0].[ProductId]=[entity1].[ProductId])
WHERE ([entity0].[isDeleted]=0)
ORDER BY [entity0].[Quantity] ASC`
            );
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

            const order = db.orders.loads((o) => o.OrderDetails.orderBy([(od) => od.Product.Price, "DESC"]));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0)
ORDER BY [entity2].[Price] DESC;

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
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

            const order = db.orders.map((o) => ({
                ods: o.OrderDetails.orderBy([(o) => o.quantity]).toArray()
            }));
            const results = await order.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0)
ORDER BY [entity1].[Quantity] ASC;

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`
            );
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
    describe("SOME", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.some();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT DISTINCT TOP 1 1 AS [column0]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBe(true);
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const any = db.orders.map((o) => ({
                order: o,
                hasDetail: o.OrderDetails.some((od) => od.Product.Price < 20000)
            }));
            const results = await any.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		(
		CASE WHEN (([entity2].[column0] IS NOT NULL)) 
		THEN 1
		ELSE 0
		END
	) AS [column1]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			1 AS [column0]
		FROM [OrderDetails] AS [entity2]
		LEFT JOIN [Products] AS [entity3]
			ON ([entity2].[ProductId]=[entity3].[ProductId])
		WHERE (([entity2].[isDeleted]=0) AND ([entity3].[Price]<20000))
		GROUP BY [entity2].[OrderId]
	) AS [entity2]
		ON ([entity0].[OrderId]=[entity2].[OrderId])
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	(
	CASE WHEN (([entity2].[column0] IS NOT NULL)) 
	THEN 1
	ELSE 0
	END
) AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		1 AS [column0]
	FROM [OrderDetails] AS [entity2]
	LEFT JOIN [Products] AS [entity3]
		ON ([entity2].[ProductId]=[entity3].[ProductId])
	WHERE (([entity2].[isDeleted]=0) AND ([entity3].[Price]<20000))
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])`
            );
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

            const any = db.orders.filter((o) => o.OrderDetails.some(() => true));
            const results = await any.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		1 AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[column0] IS NOT NULL)`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
    });
    describe("EVERY", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.every((o) => o.TotalAmount <= 20000);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT DISTINCT TOP 1 0 AS [column0]
FROM [Orders] AS [entity0]
WHERE NOT(
	([entity0].[TotalAmount]<=20000)
)`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBe(false);
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const all = db.orders.map((o) => ({
                order: o,
                hasDetail: o.OrderDetails.every((od) => od.Product.Price < 20000)
            }));
            const results = await all.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		(
		CASE WHEN (([entity2].[column0] IS NULL)) 
		THEN 1
		ELSE 0
		END
	) AS [column1]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			0 AS [column0]
		FROM [OrderDetails] AS [entity2]
		LEFT JOIN [Products] AS [entity3]
			ON ([entity2].[ProductId]=[entity3].[ProductId])
		WHERE (([entity2].[isDeleted]=0) AND NOT(
			([entity3].[Price]<20000)
		))
		GROUP BY [entity2].[OrderId]
	) AS [entity2]
		ON ([entity0].[OrderId]=[entity2].[OrderId])
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	(
	CASE WHEN (([entity2].[column0] IS NULL)) 
	THEN 1
	ELSE 0
	END
) AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		0 AS [column0]
	FROM [OrderDetails] AS [entity2]
	LEFT JOIN [Products] AS [entity3]
		ON ([entity2].[ProductId]=[entity3].[ProductId])
	WHERE (([entity2].[isDeleted]=0) AND NOT(
		([entity3].[Price]<20000)
	))
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])`
            );
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

            const all = db.orders.filter((o) => o.OrderDetails.every((od) => od.Product.Price <= 20000));
            const results = await all.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		0 AS [column0]
	FROM [OrderDetails] AS [entity1]
	LEFT JOIN [Products] AS [entity2]
		ON ([entity1].[ProductId]=[entity2].[ProductId])
	WHERE (([entity1].[isDeleted]=0) AND NOT(
		([entity2].[Price]<=20000)
	))
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[column0] IS NULL)`
            );
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
            expect(param.query).toBe(
`SELECT DISTINCT MAX([entity0].[TotalAmount]) AS [column0]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());
            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const max = db.orders.map((o) => ({
                order: o,
                maxProductPrice: o.OrderDetails.max((od) => od.Product.Price)
            }));
            const results = await max.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity3].[column0] AS [column1]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			MAX([entity3].[Price]) AS [column0]
		FROM [Products] AS [entity3]
		INNER JOIN (
			SELECT [entity2].[OrderDetailId],
				[entity2].[ProductId],
				[entity2].[OrderId],
				[entity2].[ProductName],
				[entity2].[Quantity],
				[entity2].[CreatedDate],
				[entity2].[isDeleted]
			FROM [OrderDetails] AS [entity2]
			WHERE ([entity2].[isDeleted]=0)
		) AS [entity2]
			ON ([entity2].[ProductId]=[entity3].[ProductId])
		GROUP BY [entity2].[OrderId]
	) AS [entity3]
		ON ([entity0].[OrderId]=[entity3].[OrderId])
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	[entity3].[column0] AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		MAX([entity3].[Price]) AS [column0]
	FROM [Products] AS [entity3]
	INNER JOIN (
		SELECT [entity2].[OrderDetailId],
			[entity2].[ProductId],
			[entity2].[OrderId],
			[entity2].[ProductName],
			[entity2].[Quantity],
			[entity2].[CreatedDate],
			[entity2].[isDeleted]
		FROM [OrderDetails] AS [entity2]
		WHERE ([entity2].[isDeleted]=0)
	) AS [entity2]
		ON ([entity2].[ProductId]=[entity3].[ProductId])
	GROUP BY [entity2].[OrderId]
) AS [entity3]
	ON ([entity0].[OrderId]=[entity3].[OrderId])`
            );
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

            const max = db.orders.filter((o) => o.OrderDetails.max((od) => od.Product.Price) > 20000);
            const results = await max.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		MAX([entity2].[Price]) AS [column0]
	FROM [Products] AS [entity2]
	INNER JOIN (
		SELECT [entity1].[OrderDetailId],
			[entity1].[ProductId],
			[entity1].[OrderId],
			[entity1].[ProductName],
			[entity1].[Quantity],
			[entity1].[CreatedDate],
			[entity1].[isDeleted]
		FROM [OrderDetails] AS [entity1]
		WHERE ([entity1].[isDeleted]=0)
	) AS [entity1]
		ON ([entity1].[ProductId]=[entity2].[ProductId])
	GROUP BY [entity1].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
WHERE ([entity2].[column0]>20000)`
            );
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
            expect(param.query).toBe(
`SELECT DISTINCT MIN([entity0].[TotalAmount]) AS [column0]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const min = db.orders.map((o) => ({
                order: o,
                minProductPrice: o.OrderDetails.min((od) => od.Product.Price)
            }));
            const results = await min.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity3].[column0] AS [column1]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			MIN([entity3].[Price]) AS [column0]
		FROM [Products] AS [entity3]
		INNER JOIN (
			SELECT [entity2].[OrderDetailId],
				[entity2].[ProductId],
				[entity2].[OrderId],
				[entity2].[ProductName],
				[entity2].[Quantity],
				[entity2].[CreatedDate],
				[entity2].[isDeleted]
			FROM [OrderDetails] AS [entity2]
			WHERE ([entity2].[isDeleted]=0)
		) AS [entity2]
			ON ([entity2].[ProductId]=[entity3].[ProductId])
		GROUP BY [entity2].[OrderId]
	) AS [entity3]
		ON ([entity0].[OrderId]=[entity3].[OrderId])
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	[entity3].[column0] AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		MIN([entity3].[Price]) AS [column0]
	FROM [Products] AS [entity3]
	INNER JOIN (
		SELECT [entity2].[OrderDetailId],
			[entity2].[ProductId],
			[entity2].[OrderId],
			[entity2].[ProductName],
			[entity2].[Quantity],
			[entity2].[CreatedDate],
			[entity2].[isDeleted]
		FROM [OrderDetails] AS [entity2]
		WHERE ([entity2].[isDeleted]=0)
	) AS [entity2]
		ON ([entity2].[ProductId]=[entity3].[ProductId])
	GROUP BY [entity2].[OrderId]
) AS [entity3]
	ON ([entity0].[OrderId]=[entity3].[OrderId])`
            );
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

            const min = db.orders.filter((o) => o.OrderDetails.min((od) => od.Product.Price) > 20000);
            const results = await min.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		MIN([entity2].[Price]) AS [column0]
	FROM [Products] AS [entity2]
	INNER JOIN (
		SELECT [entity1].[OrderDetailId],
			[entity1].[ProductId],
			[entity1].[OrderId],
			[entity1].[ProductName],
			[entity1].[Quantity],
			[entity1].[CreatedDate],
			[entity1].[isDeleted]
		FROM [OrderDetails] AS [entity1]
		WHERE ([entity1].[isDeleted]=0)
	) AS [entity1]
		ON ([entity1].[ProductId]=[entity2].[ProductId])
	GROUP BY [entity1].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
WHERE ([entity2].[column0]>20000)`
            );
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
            expect(param.query).toBe(
`SELECT DISTINCT AVG([entity0].[TotalAmount]) AS [column0]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const avg = db.orders.map((o) => ({
                order: o,
                avgProductPrice: o.OrderDetails.avg((od) => od.Product.Price)
            }));
            const results = await avg.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity3].[column0] AS [column1]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			AVG([entity3].[Price]) AS [column0]
		FROM [Products] AS [entity3]
		INNER JOIN (
			SELECT [entity2].[OrderDetailId],
				[entity2].[ProductId],
				[entity2].[OrderId],
				[entity2].[ProductName],
				[entity2].[Quantity],
				[entity2].[CreatedDate],
				[entity2].[isDeleted]
			FROM [OrderDetails] AS [entity2]
			WHERE ([entity2].[isDeleted]=0)
		) AS [entity2]
			ON ([entity2].[ProductId]=[entity3].[ProductId])
		GROUP BY [entity2].[OrderId]
	) AS [entity3]
		ON ([entity0].[OrderId]=[entity3].[OrderId])
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	[entity3].[column0] AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		AVG([entity3].[Price]) AS [column0]
	FROM [Products] AS [entity3]
	INNER JOIN (
		SELECT [entity2].[OrderDetailId],
			[entity2].[ProductId],
			[entity2].[OrderId],
			[entity2].[ProductName],
			[entity2].[Quantity],
			[entity2].[CreatedDate],
			[entity2].[isDeleted]
		FROM [OrderDetails] AS [entity2]
		WHERE ([entity2].[isDeleted]=0)
	) AS [entity2]
		ON ([entity2].[ProductId]=[entity3].[ProductId])
	GROUP BY [entity2].[OrderId]
) AS [entity3]
	ON ([entity0].[OrderId]=[entity3].[OrderId])`
            );
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

            const avg = db.orders.filter((o) => o.OrderDetails.avg((od) => od.Product.Price) > 20000);
            const results = await avg.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		AVG([entity2].[Price]) AS [column0]
	FROM [Products] AS [entity2]
	INNER JOIN (
		SELECT [entity1].[OrderDetailId],
			[entity1].[ProductId],
			[entity1].[OrderId],
			[entity1].[ProductName],
			[entity1].[Quantity],
			[entity1].[CreatedDate],
			[entity1].[isDeleted]
		FROM [OrderDetails] AS [entity1]
		WHERE ([entity1].[isDeleted]=0)
	) AS [entity1]
		ON ([entity1].[ProductId]=[entity2].[ProductId])
	GROUP BY [entity1].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
WHERE ([entity2].[column0]>20000)`
            );
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
            expect(param.query).toBe(
`SELECT DISTINCT SUM([entity0].[TotalAmount]) AS [column0]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const sum = db.orders.map((o) => ({
                order: o,
                sumProductPrice: o.OrderDetails.sum((od) => od.Product.Price * od.quantity)
            }));
            const results = await sum.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity2].[column1] AS [column2]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			SUM(([entity3].[Price]*[entity2].[Quantity])) AS [column1]
		FROM [OrderDetails] AS [entity2]
		LEFT JOIN [Products] AS [entity3]
			ON ([entity2].[ProductId]=[entity3].[ProductId])
		WHERE ([entity2].[isDeleted]=0)
		GROUP BY [entity2].[OrderId]
	) AS [entity2]
		ON ([entity0].[OrderId]=[entity2].[OrderId])
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	[entity2].[column1] AS [column2]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		SUM(([entity3].[Price]*[entity2].[Quantity])) AS [column1]
	FROM [OrderDetails] AS [entity2]
	LEFT JOIN [Products] AS [entity3]
		ON ([entity2].[ProductId]=[entity3].[ProductId])
	WHERE ([entity2].[isDeleted]=0)
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])`
            );
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

            const sum = db.orders.filter((o) => o.OrderDetails.sum((od) => od.quantity) > 3);
            const results = await sum.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		SUM([entity1].[Quantity]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[column0]>3)`
            );
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

            const count = db.orders.filter((o) => o.OrderDetails.sum((od) => od.quantity) > 3);
            const result = await count.count();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT DISTINCT COUNT([entity0].[OrderId]) AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		SUM([entity1].[Quantity]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[column0]>3)`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(typeof result).toBe("number");
        });
        it("could be used in select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const count = db.orders.map((o) => ({
                order: o,
                countDetails: o.OrderDetails.count()
            }));
            const results = await count.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity2].[column0] AS [column1]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			COUNT([entity2].[OrderDetailId]) AS [column0]
		FROM [OrderDetails] AS [entity2]
		WHERE ([entity2].[isDeleted]=0)
		GROUP BY [entity2].[OrderId]
	) AS [entity2]
		ON ([entity0].[OrderId]=[entity2].[OrderId])
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	[entity2].[column0] AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		COUNT([entity2].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity2]
	WHERE ([entity2].[isDeleted]=0)
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])`
            );
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

            const count = db.orders.filter((o) => o.OrderDetails.count() > 3);
            const results = await count.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity1].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[column0]>3)`
            );
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

            const count = db.orders.groupBy((o) => ({ month: o.OrderDate.getMonth() })).map((o) => ({
                qty: o.flatMap((o) => o.OrderDetails).map((o) => o.quantity).sum(),
                bc: o.filter((o) => o.TotalAmount > 20000).count(),
                cd: o.filter((o) => o.TotalAmount <= 20000).count()
            }));
            const results = await count.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT SUM([entity1].[Quantity]) AS [column1],
	COUNT([entity2].[OrderId]) AS [column2],
	COUNT([entity3].[OrderId]) AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[Quantity]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN (
	SELECT [entity2].[OrderId]
	FROM [Orders] AS [entity2]
	WHERE ([entity2].[TotalAmount]>20000)
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
LEFT JOIN (
	SELECT [entity3].[OrderId]
	FROM [Orders] AS [entity3]
	WHERE ([entity3].[TotalAmount]<=20000)
) AS [entity3]
	ON ([entity0].[OrderId]=[entity3].[OrderId])
GROUP BY (MONTH([entity0].[OrderDate]) - 1)`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
ORDER BY (SELECT NULL)
OFFSET 5 ROWS
FETCH NEXT 1 ROWS ONLY`
            );
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
            expect(param.query).toBe(
`SELECT TOP 5 [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
INNER JOIN (
	SELECT TOP 10 [entity1].[OrderId]
	FROM [Orders] AS [entity1]
	ORDER BY [entity1].[OrderDate] DESC
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
ORDER BY [entity0].[TotalAmount] DESC`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("should work in include", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const take = db.orders.loads((o) => o.OrderDetails.orderBy([(o) => o.quantity]).take(10).skip(1).take(2).skip(1));
            const results = await take.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN (
	SELECT [entity2].[OrderDetailId],
		COUNT([entity2].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity2]
	INNER JOIN (
		SELECT [entity3].[OrderDetailId],
			[entity3].[OrderId],
			[entity3].[Quantity]
		FROM [OrderDetails] AS [entity3]
		WHERE ([entity3].[isDeleted]=0)
	) AS [entity3]
		ON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]>[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))
	WHERE ([entity2].[isDeleted]=0)
	GROUP BY [entity2].[OrderDetailId]
	HAVING ((COUNT([entity2].[OrderDetailId])>2) AND (COUNT([entity2].[OrderDetailId])<=3))
) AS [entity2]
	ON ([entity1].[OrderDetailId]=[entity2].[OrderDetailId])
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0)
ORDER BY [entity1].[Quantity] ASC;

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            const any = results.some((o) => o.OrderDetails.count() > 1);
            expect(typeof any).toBe("boolean");
            expect(any).toBe(false);
        });
        it("should work in include 2 (consider orderBy after take)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const take = db.orders.
                loads((o) => o.OrderDetails
                    .orderBy([(o) => o.quantity, "DESC"])
                    .take(5).skip(1)
                    .orderBy([(o) => o.name])
                    .take(3)
                ).take(10);
            const results = await take.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN (
	SELECT [entity4].[OrderDetailId]
	FROM [OrderDetails] AS [entity4]
	INNER JOIN (
		SELECT [entity2].[OrderDetailId],
			COUNT([entity2].[OrderDetailId]) AS [column0]
		FROM [OrderDetails] AS [entity2]
		INNER JOIN (
			SELECT [entity3].[OrderDetailId],
				[entity3].[OrderId],
				[entity3].[Quantity]
			FROM [OrderDetails] AS [entity3]
			WHERE ([entity3].[isDeleted]=0)
		) AS [entity3]
			ON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]<[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))
		WHERE ([entity2].[isDeleted]=0)
		GROUP BY [entity2].[OrderDetailId]
		HAVING ((COUNT([entity2].[OrderDetailId])>1) AND (COUNT([entity2].[OrderDetailId])<=5))
	) AS [entity2]
		ON ([entity4].[OrderDetailId]=[entity2].[OrderDetailId])
	WHERE ([entity4].[isDeleted]=0)
) AS [entity4]
	ON ([entity1].[OrderDetailId]=[entity4].[OrderDetailId])
INNER JOIN (
	SELECT [entity5].[OrderDetailId],
		COUNT([entity5].[OrderDetailId]) AS [column1]
	FROM [OrderDetails] AS [entity5]
	INNER JOIN (
		SELECT [entity4].[OrderDetailId]
		FROM [OrderDetails] AS [entity4]
		INNER JOIN (
			SELECT [entity2].[OrderDetailId],
				COUNT([entity2].[OrderDetailId]) AS [column0]
			FROM [OrderDetails] AS [entity2]
			INNER JOIN (
				SELECT [entity3].[OrderDetailId],
					[entity3].[OrderId],
					[entity3].[Quantity]
				FROM [OrderDetails] AS [entity3]
				WHERE ([entity3].[isDeleted]=0)
			) AS [entity3]
				ON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]<[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))
			WHERE ([entity2].[isDeleted]=0)
			GROUP BY [entity2].[OrderDetailId]
			HAVING ((COUNT([entity2].[OrderDetailId])>1) AND (COUNT([entity2].[OrderDetailId])<=5))
		) AS [entity2]
			ON ([entity4].[OrderDetailId]=[entity2].[OrderDetailId])
		WHERE ([entity4].[isDeleted]=0)
	) AS [entity4]
		ON ([entity5].[OrderDetailId]=[entity4].[OrderDetailId])
	INNER JOIN (
		SELECT [entity6].[OrderDetailId],
			[entity6].[OrderId],
			[entity6].[ProductName]
		FROM [OrderDetails] AS [entity6]
		INNER JOIN (
			SELECT [entity4].[OrderDetailId]
			FROM [OrderDetails] AS [entity4]
			INNER JOIN (
				SELECT [entity2].[OrderDetailId],
					COUNT([entity2].[OrderDetailId]) AS [column0]
				FROM [OrderDetails] AS [entity2]
				INNER JOIN (
					SELECT [entity3].[OrderDetailId],
						[entity3].[OrderId],
						[entity3].[Quantity]
					FROM [OrderDetails] AS [entity3]
					WHERE ([entity3].[isDeleted]=0)
				) AS [entity3]
					ON (([entity3].[OrderId]=[entity2].[OrderId]) AND (([entity3].[Quantity]<[entity2].[Quantity]) OR (([entity3].[Quantity]=[entity2].[Quantity]) AND ([entity3].[OrderDetailId]>=[entity2].[OrderDetailId]))))
				WHERE ([entity2].[isDeleted]=0)
				GROUP BY [entity2].[OrderDetailId]
				HAVING ((COUNT([entity2].[OrderDetailId])>1) AND (COUNT([entity2].[OrderDetailId])<=5))
			) AS [entity2]
				ON ([entity4].[OrderDetailId]=[entity2].[OrderDetailId])
			WHERE ([entity4].[isDeleted]=0)
		) AS [entity4]
			ON ([entity6].[OrderDetailId]=[entity4].[OrderDetailId])
	) AS [entity6]
		ON (([entity6].[OrderId]=[entity5].[OrderId]) AND (([entity6].[ProductName]>[entity5].[ProductName]) OR (([entity6].[ProductName]=[entity5].[ProductName]) AND ([entity6].[OrderDetailId]>=[entity5].[OrderDetailId]))))
	GROUP BY [entity5].[OrderDetailId]
	HAVING (COUNT([entity5].[OrderDetailId])<=3)
) AS [entity5]
	ON ([entity1].[OrderDetailId]=[entity5].[OrderDetailId])
INNER JOIN (
	SELECT TOP 10 [entity0].[OrderId],
		[entity0].[TotalAmount],
		[entity0].[OrderDate]
	FROM [Orders] AS [entity0]
) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId])
ORDER BY [entity1].[ProductName] ASC;

SELECT TOP 10 [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);;
            const any = results.some((o) => o.OrderDetails.count() > 3);
            expect(typeof any).toBe("boolean");
            expect(any).toBe(false);
        });
    });
    describe("FIND", async () => {
        it("should work", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.find();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT TOP 1 [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBeInstanceOf(Order);
            expect(db.orders.local.count()).toBe(1);
        });
        it("should work with where", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const result = await db.orders.filter((o) => o.OrderDate < new Date()).find((o) => o.TotalAmount > 20000);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT TOP 1 [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE (([entity0].[OrderDate]<getdate()) AND ([entity0].[TotalAmount]>20000))`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(result).toBeInstanceOf(Order);
            expect(db.orders.local.count()).toBe(1);
        });
        it("should work with select", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const first = db.orders.map((o) => ({
                order: o,
                lastAddedItem: o.OrderDetails.orderBy([(o) => o.CreatedDate, "DESC"]).first()
            }));
            const results = await first.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity2].[OrderDetailId],
	[entity2].[OrderId],
	[entity2].[ProductId],
	[entity2].[ProductName],
	[entity2].[Quantity],
	[entity2].[CreatedDate],
	[entity2].[isDeleted]
FROM [OrderDetails] AS [entity2]
INNER JOIN (
	SELECT [entity3].[OrderDetailId],
		COUNT([entity3].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity3]
	INNER JOIN (
		SELECT [entity4].[OrderDetailId],
			[entity4].[OrderId],
			[entity4].[CreatedDate],
			[entity4].[ProductId],
			[entity4].[ProductName],
			[entity4].[Quantity],
			[entity4].[isDeleted]
		FROM [OrderDetails] AS [entity4]
		WHERE ([entity4].[isDeleted]=0)
	) AS [entity4]
		ON (([entity4].[OrderId]=[entity3].[OrderId]) AND (([entity4].[CreatedDate]<[entity3].[CreatedDate]) OR (([entity4].[CreatedDate]=[entity3].[CreatedDate]) AND ([entity4].[OrderDetailId]>=[entity3].[OrderDetailId]))))
	WHERE ([entity3].[isDeleted]=0)
	GROUP BY [entity3].[OrderDetailId]
	HAVING (COUNT([entity3].[OrderDetailId])<=1)
) AS [entity3]
	ON ([entity2].[OrderDetailId]=[entity3].[OrderDetailId])
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId])
WHERE ([entity2].[isDeleted]=0)
ORDER BY [entity2].[CreatedDate] DESC;

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`);
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

            const distinct = db.orders.map((o) => o.TotalAmount).distinct();
            const results = await distinct.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT DISTINCT [entity0].[TotalAmount]
FROM [Orders] AS [entity0]`
            );
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

            const distinct = db.orders.map((o) => ({
                order: o,
                quantities: o.OrderDetails.map((p) => p.quantity).distinct().toArray()
            }));
            const results = await distinct.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN [Orders] AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT DISTINCT [entity2].[OrderId],
	[entity2].[Quantity]
FROM [OrderDetails] AS [entity2]
INNER JOIN [Orders] AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId])
WHERE ([entity2].[isDeleted]=0);

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]`
            );
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
        it("groupBy.(o => o.column).map(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate).map((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderDate]
FROM [Orders] AS [entity0]
GROUP BY [entity0].[OrderDate]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Date);
            }
        });
        it("groupBy.(o => o.column).map(o => o.key.method())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate).map((o) => o.key.getDate());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT DAY([entity0].[OrderDate]) AS [column0]
FROM [Orders] AS [entity0]
GROUP BY [entity0].[OrderDate]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.column).map(o => o.count())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate).map((o) => o.count());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT COUNT([entity0].[OrderId]) AS [column0]
FROM [Orders] AS [entity0]
GROUP BY [entity0].[OrderDate]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.column + o.column).map(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate() + o.OrderDate.getFullYear()).map((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate])) AS [column0]
FROM [Orders] AS [entity0]
GROUP BY (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate]))`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.column + o.column).map(o => {column: o.key, count: o.count(), sum: o.sum()})", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate() + o.OrderDate.getFullYear()).map((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.filter((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate])) AS [column0],
	COUNT([entity0].[OrderId]) AS [column1],
	SUM([entity1].[TotalAmount]) AS [column2]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		[entity1].[TotalAmount]
	FROM [Orders] AS [entity1]
	WHERE ([entity1].[TotalAmount]<10000)
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
GROUP BY (DAY([entity0].[OrderDate])+YEAR([entity0].[OrderDate]))`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted],
	([entity0].[Quantity]*[entity1].[Price]) AS [GrossSales]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Products] AS [entity1]
	ON ([entity0].[ProductId]=[entity1].[ProductId])
WHERE ([entity0].[isDeleted]=0)`
            );
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

            const groupBy = db.orderDetails.take(100).filter((o) => o.GrossSales > 10000).map((o) => o.Order).groupBy((o) => o.OrderDate.getFullYear()).map((o) => ({
                dateYear: o.key,
                count: o.count(),
                sum: o.filter((o) => o.TotalAmount < 10000).sum((o) => o.TotalAmount)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT YEAR([entity2].[OrderDate]) AS [column0],
	COUNT([entity2].[OrderId]) AS [column1],
	SUM([entity3].[TotalAmount]) AS [column2]
FROM [Orders] AS [entity2]
INNER JOIN (
	SELECT TOP 100 [entity0].[OrderDetailId],
		[entity0].[OrderId],
		[entity0].[ProductId],
		[entity0].[ProductName],
		[entity0].[Quantity],
		[entity0].[CreatedDate],
		[entity0].[isDeleted]
	FROM [OrderDetails] AS [entity0]
	LEFT JOIN [Products] AS [entity1]
		ON ([entity0].[ProductId]=[entity1].[ProductId])
	WHERE (([entity0].[isDeleted]=0) AND (([entity0].[Quantity]*[entity1].[Price])>10000))
) AS [entity0]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
LEFT JOIN (
	SELECT [entity3].[OrderId],
		[entity3].[TotalAmount]
	FROM [Orders] AS [entity3]
	WHERE ([entity3].[TotalAmount]<10000)
) AS [entity3]
	ON ([entity2].[OrderId]=[entity3].[OrderId])
GROUP BY YEAR([entity2].[OrderDate])`
            );
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
        it("groupBy.(o => o.column.method()).map(o => o.toArray())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate()).map((o) => o.toArray());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate],
	DAY([entity1].[OrderDate]) AS [column0]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT DAY([entity0].[OrderDate]) AS [column0]
	FROM [Orders] AS [entity0]
	GROUP BY DAY([entity0].[OrderDate])
) AS [entity0]
	ON ([entity0].[column0]=DAY([entity1].[OrderDate]))`
            );
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
        it("groupBy.(o => o.column.method()).map(o => ({items: o}))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orders.groupBy((o) => o.OrderDate.getDate()).map((o) => ({
                details: o.toArray()
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	DAY([entity1].[OrderDate]) AS [column0],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT DAY([entity0].[OrderDate]) AS [column0]
	FROM [Orders] AS [entity0]
	GROUP BY DAY([entity0].[OrderDate])
) AS [entity0] ON ([entity0].[column0]=DAY([entity1].[OrderDate]));

SELECT DAY([entity0].[OrderDate]) AS [column0]
FROM [Orders] AS [entity0]
GROUP BY DAY([entity0].[OrderDate])`
            );
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
        it("groupBy.(o => o.toOneRelation).map(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.filter((o) => o.quantity > 1).groupBy((o) => o.Order).map((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId]
	FROM [OrderDetails] AS [entity0]
	WHERE (([entity0].[isDeleted]=0) AND ([entity0].[Quantity]>1))
	GROUP BY [entity0].[OrderId]
) AS [entity0]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("groupBy.(o => o.toOneRelation).map(o => o.key.column.method())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => o.Order).map((o) => o.key.OrderDate.getDate());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT DAY([entity1].[OrderDate]) AS [column0]
FROM [OrderDetails] AS [entity0]
INNER JOIN [Orders] AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
WHERE ([entity0].[isDeleted]=0)
GROUP BY [entity0].[OrderId], [entity1].[OrderDate]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.toOneRelation).map(o => o.count())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => o.Order).map((o) => o.count());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT COUNT([entity0].[OrderDetailId]) AS [column0]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)
GROUP BY [entity0].[OrderId]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy.(o => o.toOneRelation.toOneRelation).map(o => o.key.column)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => o.OrderDetail.Order).map((o) => o.key.OrderDate);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderId],
	[entity2].[OrderDate]
FROM [Orders] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderId]
	FROM [OrderDetailProperties] AS [entity0]
	LEFT JOIN (
		SELECT [entity1].[OrderDetailId],
			[entity1].[OrderId],
			[entity1].[ProductId],
			[entity1].[ProductName],
			[entity1].[Quantity],
			[entity1].[CreatedDate],
			[entity1].[isDeleted]
		FROM [OrderDetails] AS [entity1]
		WHERE ([entity1].[isDeleted]=0)
	) AS [entity1]
		ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
	GROUP BY [entity1].[OrderId]
) AS [entity0]
	ON ([entity0].[OrderId]=[entity2].[OrderId])`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Date);
            }
        });
        it("groupBy.(o => o.toOneRelation).map(o => {col: o.key, count: o.count(), sum: o.filter().sum()})", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => o.Order).map((o) => ({
                order: o.key,
                count: o.count(),
                sum: o.filter((o) => o.quantity > 1).sum((o) => o.quantity)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderId],
	[entity1].[TotalAmount],
	[entity1].[OrderDate]
FROM [Orders] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId],
		COUNT([entity0].[OrderDetailId]) AS [column0],
		SUM([entity2].[Quantity]) AS [column1]
	FROM [OrderDetails] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderDetailId],
			[entity2].[Quantity]
		FROM [OrderDetails] AS [entity2]
		WHERE ([entity2].[Quantity]>1)
	) AS [entity2]
		ON ([entity0].[OrderDetailId]=[entity2].[OrderDetailId])
	WHERE ([entity0].[isDeleted]=0)
	GROUP BY [entity0].[OrderId]
) AS [entity0] ON ([entity0].[OrderId]=[entity1].[OrderId]);

SELECT [entity0].[OrderId],
	COUNT([entity0].[OrderDetailId]) AS [column0],
	SUM([entity2].[Quantity]) AS [column1]
FROM [OrderDetails] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderDetailId],
		[entity2].[Quantity]
	FROM [OrderDetails] AS [entity2]
	WHERE ([entity2].[Quantity]>1)
) AS [entity2]
	ON ([entity0].[OrderDetailId]=[entity2].[OrderDetailId])
WHERE ([entity0].[isDeleted]=0)
GROUP BY [entity0].[OrderId]`
            );
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
        it("groupBy(o => ({obj: {prop: o.col} })).map(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                obj: {
                    pid: o.ProductId
                },
                Quantity: o.quantity * 2
            })).map((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT ([entity0].[Quantity]*2) AS [column1],
	[entity0].[ProductId] AS [column0]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)
GROUP BY ([entity0].[Quantity]*2), [entity0].[ProductId]`
            );
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
        it("groupBy(o => ({obj: {prop: o.col} })).map(o => o.key.obj)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                obj: {
                    pid: o.ProductId
                },
                Quantity: o.quantity * 2
            })).map((o) => o.key.obj);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[ProductId] AS [column0]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)
GROUP BY ([entity0].[Quantity]*2), [entity0].[ProductId]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.pid).toBeInstanceOf(Uuid);
            }
        });
        it("groupBy(o => ({obj: {prop: o.col} })).map(o => o.key.obj.prop)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                obj: {
                    pid: o.ProductId
                },
                Quantity: o.quantity * 2
            })).map((o) => o.key.obj.pid);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[ProductId] AS [column0]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)
GROUP BY ([entity0].[Quantity]*2), [entity0].[ProductId]`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Uuid);
            }
        });
        it("groupBy(o => o.toOneRelation.toOneRelation).map(o => {col: o.key, count: o.count(), sum: o.filter().sum()})", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => o.OrderDetail.Order).map((o) => ({
                order: o.key,
                count: o.count(),
                sum: o.filter((o) => o.amount < 20000).sum((o) => o.amount)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderId],
	[entity2].[TotalAmount],
	[entity2].[OrderDate]
FROM [Orders] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity0].[OrderDetailPropertyId]) AS [column0],
		SUM([entity3].[Amount]) AS [column1]
	FROM [OrderDetailProperties] AS [entity0]
	LEFT JOIN (
		SELECT [entity1].[OrderDetailId],
			[entity1].[OrderId],
			[entity1].[ProductId],
			[entity1].[ProductName],
			[entity1].[Quantity],
			[entity1].[CreatedDate],
			[entity1].[isDeleted]
		FROM [OrderDetails] AS [entity1]
		WHERE ([entity1].[isDeleted]=0)
	) AS [entity1]
		ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
	LEFT JOIN (
		SELECT [entity3].[OrderDetailPropertyId],
			[entity3].[Amount]
		FROM [OrderDetailProperties] AS [entity3]
		WHERE ([entity3].[Amount]<20000)
	) AS [entity3]
		ON ([entity0].[OrderDetailPropertyId]=[entity3].[OrderDetailPropertyId])
	GROUP BY [entity1].[OrderId]
) AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId]);

SELECT [entity1].[OrderId],
	COUNT([entity0].[OrderDetailPropertyId]) AS [column0],
	SUM([entity3].[Amount]) AS [column1]
FROM [OrderDetailProperties] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
LEFT JOIN (
	SELECT [entity3].[OrderDetailPropertyId],
		[entity3].[Amount]
	FROM [OrderDetailProperties] AS [entity3]
	WHERE ([entity3].[Amount]<20000)
) AS [entity3]
	ON ([entity0].[OrderDetailPropertyId]=[entity3].[OrderDetailPropertyId])
GROUP BY [entity1].[OrderId]`
            );
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
        it("groupBy(o => o.toOneRelation).map(o => o.key.toOneRelation)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => o.OrderDetail).map((o) => o.key.Order);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity2].[OrderId],
	[entity2].[TotalAmount],
	[entity2].[OrderDate]
FROM [Orders] AS [entity2]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	INNER JOIN (
		SELECT [entity0].[OrderDetailId]
		FROM [OrderDetailProperties] AS [entity0]
		GROUP BY [entity0].[OrderDetailId]
	) AS [entity0]
		ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity1].[OrderId]=[entity2].[OrderId])`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o).toBeInstanceOf(Order);
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => o.key)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).map((o) => o.key);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[ProductId],
	([entity0].[Quantity]*2) AS [column0]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)
GROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(o.productid).toBeInstanceOf(Uuid);
                expect(typeof o.Quantity).toBe("number");
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => o.count())", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).map((o) => o.count());
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT COUNT([entity0].[OrderDetailId]) AS [column1]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)
GROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => o.key.col)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).map((o) => o.key.Quantity);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT ([entity0].[Quantity]*2) AS [column0]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)
GROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)`
            );
            expect(param.type).toBe(QueryType.DQL);
            expect(param.parameters).toEqual(new Map());

            expect(results).toBeInstanceOf(Array);
            expect(results.length).not.toBe(0);
            for (const o of results) {
                expect(typeof o).toBe("number");
            }
        });
        it("groupBy(o => ({col: o.column, col: o.column*2 })).map(o => ({ col: { col: col }}))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                productid: o.ProductId,
                Quantity: o.quantity * 2
            })).map((o) => ({
                data: {
                    pid: o.key.productid,
                    qty: o.key.Quantity,
                    avg: o.avg((o) => o.quantity)
                },
                count: o.count(),
                sum: o.filter((o) => o.quantity > 1).sum((o) => o.quantity)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT COUNT([entity0].[OrderDetailId]) AS [column3],
	SUM([entity2].[Quantity]) AS [column4],
	[entity0].[ProductId] AS [column1],
	([entity0].[Quantity]*2) AS [column0],
	AVG([entity1].[Quantity]) AS [column2]
FROM [OrderDetails] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderDetailId],
		[entity2].[Quantity]
	FROM [OrderDetails] AS [entity2]
	WHERE ([entity2].[Quantity]>1)
) AS [entity2]
	ON ([entity0].[OrderDetailId]=[entity2].[OrderDetailId])
LEFT JOIN [OrderDetails] AS [entity1]
	ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
WHERE ([entity0].[isDeleted]=0)
GROUP BY [entity0].[ProductId], ([entity0].[Quantity]*2)`
            );
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
        it("groupBy(o => ({col: o.toOneRelation.column.method(), col: o.toOneRelation.column })).map(o => ({ col: { col: col }}))", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetails.groupBy((o) => ({
                date: o.Order.OrderDate.getDate(),
                price: o.Product.Price
            })).map((o) => ({
                data: {
                    day: o.key.date,
                    price: o.key.price,
                    avg: o.avg((o) => o.quantity)
                },
                count: o.count(),
                sum: o.filter((o) => o.quantity > 1).sum((o) => o.quantity)
            }));
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT COUNT([entity0].[OrderDetailId]) AS [column3],
	SUM([entity4].[Quantity]) AS [column4],
	DAY([entity1].[OrderDate]) AS [column0],
	[entity2].[Price] AS [column1],
	AVG([entity3].[Quantity]) AS [column2]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Orders] AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN [Products] AS [entity2]
	ON ([entity0].[ProductId]=[entity2].[ProductId])
LEFT JOIN (
	SELECT [entity4].[OrderDetailId],
		[entity4].[Quantity]
	FROM [OrderDetails] AS [entity4]
	WHERE ([entity4].[Quantity]>1)
) AS [entity4]
	ON ([entity0].[OrderDetailId]=[entity4].[OrderDetailId])
LEFT JOIN [OrderDetails] AS [entity3]
	ON ([entity0].[OrderDetailId]=[entity3].[OrderDetailId])
WHERE ([entity0].[isDeleted]=0)
GROUP BY DAY([entity1].[OrderDate]), [entity2].[Price]`
            );
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
        it("groupBy.(o => ({col: o.toOneRelation })).map(o => o.key).map(o => o.col.name)", async () => {
            const spy = vi.spyOn(db.connection, "query");

            const groupBy = db.orderDetailProperties.groupBy((o) => ({
                od: o.OrderDetail
            })).map((o) => o.key).map((o) => o.od.name);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[ProductName]
FROM [OrderDetails] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderDetailId]
	FROM [OrderDetailProperties] AS [entity0]
	GROUP BY [entity0].[OrderDetailId]
) AS [entity0]
	ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
WHERE ([entity1].[isDeleted]=0)`
            );
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

            const groupBy = db.orders.filter((o) => o.TotalAmount > 20000).groupBy((o) => o.OrderDate.getDate())
                .filter((o) => o.count() > 3);
            const results = await groupBy.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate],
	DAY([entity0].[OrderDate]) AS [column0]
FROM [Orders] AS [entity0]
INNER JOIN (
	SELECT DISTINCT DAY([rel_entity0].[OrderDate]) AS [column0]
	FROM [Orders] AS [rel_entity0]
	WHERE ([rel_entity0].[TotalAmount]>20000)
	GROUP BY DAY([rel_entity0].[OrderDate])
	HAVING (COUNT([rel_entity0].[OrderId])>3)
) AS [rel_entity0]
	ON (DAY([entity0].[OrderDate])=[rel_entity0].[column0])
WHERE ([entity0].[TotalAmount]>20000)`
            );
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
            expect(param.query).toBe(
`SELECT [entity2].[OrderId],
	[entity2].[TotalAmount],
	[entity2].[OrderDate]
FROM [Orders] AS [entity2]
INNER JOIN (
	SELECT [entity0].[OrderDetailPropertyId],
		[entity0].[OrderDetailId],
		[entity0].[Name],
		[entity0].[Amount],
		[entity1].[OrderId]
	FROM [OrderDetailProperties] AS [entity0]
	LEFT JOIN (
		SELECT [entity1].[OrderDetailId],
			[entity1].[OrderId],
			[entity1].[ProductId],
			[entity1].[ProductName],
			[entity1].[Quantity],
			[entity1].[CreatedDate],
			[entity1].[isDeleted]
		FROM [OrderDetails] AS [entity1]
		WHERE ([entity1].[isDeleted]=0)
	) AS [entity1]
		ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
) AS [entity0] ON ([entity0].[OrderId]=[entity2].[OrderId]);

SELECT [entity0].[OrderDetailPropertyId],
	[entity0].[OrderDetailId],
	[entity0].[Name],
	[entity0].[Amount],
	[entity1].[OrderId]
FROM [OrderDetailProperties] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted],
	DAY([entity1].[OrderDate]) AS [column0],
	[entity2].[Price]
FROM [OrderDetails] AS [entity0]
LEFT JOIN [Orders] AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN [Products] AS [entity2]
	ON ([entity0].[ProductId]=[entity2].[ProductId])
WHERE ([entity0].[isDeleted]=0)`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted],
	([entity0].[Quantity]*2) AS [column1],
	[entity0].[ProductId] AS [column0]
FROM [OrderDetails] AS [entity0]
WHERE ([entity0].[isDeleted]=0)`
            );
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
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderDetailPropertyId],
		[entity0].[OrderDetailId],
		[entity0].[Name],
		[entity0].[Amount]
	FROM [OrderDetailProperties] AS [entity0]
) AS [entity0] ON ([entity0].[OrderDetailId]=[entity1].[OrderDetailId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderDetailPropertyId],
	[entity0].[OrderDetailId],
	[entity0].[Name],
	[entity0].[Amount]
FROM [OrderDetailProperties] AS [entity0]`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[OrderId] AS [column0],
	[entity0].[OrderDate] AS [column1]
FROM [Orders] AS [entity0]`
            );
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
            const results = await db.orders.loads((o) => o.OrderDetails).toMap((o) => o.OrderId, (o) => o);

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN (
	SELECT [entity2].[OrderId],
		[entity2].[TotalAmount],
		[entity2].[OrderDate]
	FROM [Orders] AS [entity2]
	INNER JOIN (
		SELECT [entity0].[OrderId],
			[entity0].[OrderId] AS [column0]
		FROM [Orders] AS [entity0]
	) AS [entity0] ON ([entity2].[OrderId]=[entity0].[OrderId])
) AS [entity2] ON ([entity2].[OrderId]=[entity1].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity2].[OrderId],
	[entity2].[TotalAmount],
	[entity2].[OrderDate]
FROM [Orders] AS [entity2]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity0].[OrderId] AS [column0]
	FROM [Orders] AS [entity0]
) AS [entity0] ON ([entity2].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId],
	[entity0].[OrderId] AS [column0]
FROM [Orders] AS [entity0]`
            );
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
            })).filter((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity1].[Quantity] AS [column0],
	[entity1].[ProductName] AS [column1],
	[entity2].[Price] AS [column2],
	[entity0].[OrderDate] AS [column3]
FROM [Orders] AS [entity0]
INNER JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
WHERE ([entity1].[Quantity]>1)`
            );
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
                propertyNames: o2.OrderDetailProperties.map((o) => o.name).toArray()
            })).filter((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity3].[OrderDetailPropertyId],
	[entity3].[OrderDetailId],
	[entity3].[Name]
FROM [OrderDetailProperties] AS [entity3]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity1].[OrderDetailId],
		[entity1].[Quantity] AS [column0],
		[entity1].[ProductName] AS [column1],
		[entity2].[Price] AS [column2],
		[entity0].[OrderDate] AS [column3]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity1].[OrderDetailId],
			[entity1].[OrderId],
			[entity1].[ProductId],
			[entity1].[ProductName],
			[entity1].[Quantity],
			[entity1].[CreatedDate],
			[entity1].[isDeleted]
		FROM [OrderDetails] AS [entity1]
		WHERE ([entity1].[isDeleted]=0)
	) AS [entity1]
		ON ([entity0].[OrderId]=[entity1].[OrderId])
	LEFT JOIN [Products] AS [entity2]
		ON ([entity1].[ProductId]=[entity2].[ProductId])
	WHERE ([entity1].[Quantity]>1)
) AS [entity0] ON ([entity0].[OrderDetailId]=[entity3].[OrderDetailId]);

SELECT [entity0].[OrderId],
	[entity1].[OrderDetailId],
	[entity1].[Quantity] AS [column0],
	[entity1].[ProductName] AS [column1],
	[entity2].[Price] AS [column2],
	[entity0].[OrderDate] AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
WHERE ([entity1].[Quantity]>1)`
            );
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
            })).filter((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity1].[Quantity] AS [column0],
	[entity1].[ProductName] AS [column1],
	[entity2].[Price] AS [column2],
	[entity0].[OrderDate] AS [column3]
FROM [Orders] AS [entity0]
RIGHT JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
WHERE ([entity1].[Quantity]>1)`
            );
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
            })).filter((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity1].[Quantity] AS [column0],
	[entity1].[ProductName] AS [column1],
	[entity2].[Price] AS [column2],
	[entity0].[OrderDate] AS [column3]
FROM [Orders] AS [entity0]
FULL JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
WHERE ([entity1].[Quantity]>1)`
            );
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
                names: o2.map((d) => d.name).toArray(),
                price: o2.sum((d) => d.Product.Price),
                date: o1.OrderDate
            })).filter((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity3].[OrderDetailId],
	[entity3].[OrderId],
	[entity3].[ProductName]
FROM [OrderDetails] AS [entity3]
INNER JOIN (
	SELECT [entity0].[OrderId],
		[entity2].[column0] AS [column1],
		[entity5].[column2] AS [column3],
		[entity0].[OrderDate] AS [column4]
	FROM [Orders] AS [entity0]
	LEFT JOIN (
		SELECT [entity2].[OrderId],
			SUM([entity2].[Quantity]) AS [column0]
		FROM [OrderDetails] AS [entity2]
		WHERE ([entity2].[isDeleted]=0)
		GROUP BY [entity2].[OrderId]
	) AS [entity2]
		ON ([entity0].[OrderId]=[entity2].[OrderId])
	LEFT JOIN (
		SELECT [entity4].[OrderId],
			SUM([entity5].[Price]) AS [column2]
		FROM [Products] AS [entity5]
		INNER JOIN (
			SELECT [entity4].[OrderDetailId],
				[entity4].[ProductId],
				[entity4].[OrderId],
				[entity4].[ProductName],
				[entity4].[Quantity],
				[entity4].[CreatedDate],
				[entity4].[isDeleted]
			FROM [OrderDetails] AS [entity4]
			WHERE ([entity4].[isDeleted]=0)
		) AS [entity4]
			ON ([entity4].[ProductId]=[entity5].[ProductId])
		GROUP BY [entity4].[OrderId]
	) AS [entity5]
		ON ([entity0].[OrderId]=[entity5].[OrderId])
	WHERE ([entity2].[column0]>1)
) AS [entity0] ON ([entity0].[OrderId]=[entity3].[OrderId])
WHERE ([entity3].[isDeleted]=0);

SELECT [entity0].[OrderId],
	[entity2].[column0] AS [column1],
	[entity5].[column2] AS [column3],
	[entity0].[OrderDate] AS [column4]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		SUM([entity2].[Quantity]) AS [column0]
	FROM [OrderDetails] AS [entity2]
	WHERE ([entity2].[isDeleted]=0)
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
LEFT JOIN (
	SELECT [entity4].[OrderId],
		SUM([entity5].[Price]) AS [column2]
	FROM [Products] AS [entity5]
	INNER JOIN (
		SELECT [entity4].[OrderDetailId],
			[entity4].[ProductId],
			[entity4].[OrderId],
			[entity4].[ProductName],
			[entity4].[Quantity],
			[entity4].[CreatedDate],
			[entity4].[isDeleted]
		FROM [OrderDetails] AS [entity4]
		WHERE ([entity4].[isDeleted]=0)
	) AS [entity4]
		ON ([entity4].[ProductId]=[entity5].[ProductId])
	GROUP BY [entity4].[OrderId]
) AS [entity5]
	ON ([entity0].[OrderId]=[entity5].[OrderId])
WHERE ([entity2].[column0]>1)`
            );
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
            })).filter((o) => o.quantity > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity1].[Quantity] AS [column0],
	[entity1].[ProductName] AS [column1],
	[entity2].[Price] AS [column2],
	[entity0].[OrderDate] AS [column3]
FROM [Orders] AS [entity0]
CROSS JOIN (
	SELECT [entity1].[OrderDetailId],
		[entity1].[OrderId],
		[entity1].[ProductId],
		[entity1].[ProductName],
		[entity1].[Quantity],
		[entity1].[CreatedDate],
		[entity1].[isDeleted]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
) AS [entity1]
LEFT JOIN [Products] AS [entity2]
	ON ([entity1].[ProductId]=[entity2].[ProductId])
WHERE ([entity1].[Quantity]>1)`
            );
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
            const join = greatest.union(worst).filter((o) => o.OrderDetails.count() > 1);
            const results = await join.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM (
	SELECT TOP 5 [entity0].[OrderId],
		[entity0].[TotalAmount],
		[entity0].[OrderDate]
	FROM [Orders] AS [entity0]
	ORDER BY [entity0].[TotalAmount] DESC
	UNION
	SELECT TOP 5 [entity1].[OrderId],
		[entity1].[TotalAmount],
		[entity1].[OrderDate]
	FROM [Orders] AS [entity1]
	ORDER BY [entity1].[TotalAmount] ASC
) AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		COUNT([entity2].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity2]
	WHERE ([entity2].[isDeleted]=0)
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
WHERE ([entity2].[column0]>1)`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM (
	SELECT TOP 10 [entity0].[OrderId],
		[entity0].[TotalAmount],
		[entity0].[OrderDate]
	FROM [Orders] AS [entity0]
	ORDER BY [entity0].[TotalAmount] DESC
	UNION ALL
	SELECT TOP 5 [entity1].[OrderId],
		[entity1].[TotalAmount],
		[entity1].[OrderDate]
	FROM [Orders] AS [entity1]
	ORDER BY [entity1].[TotalAmount] ASC
) AS [entity0]`
            );
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
            expect(param.query).toBe(
`SELECT TOP 5 [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM (
	SELECT TOP 10 [entity0].[OrderId],
		[entity0].[TotalAmount],
		[entity0].[OrderDate]
	FROM [Orders] AS [entity0]
	ORDER BY [entity0].[TotalAmount] DESC
	INTERSECT
	SELECT TOP 10 [entity1].[OrderId],
		[entity1].[TotalAmount],
		[entity1].[OrderDate]
	FROM [Orders] AS [entity1]
	ORDER BY [entity1].[TotalAmount] ASC
) AS [entity0]`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM (
	SELECT TOP 10 [entity0].[OrderId],
		[entity0].[TotalAmount],
		[entity0].[OrderDate]
	FROM [Orders] AS [entity0]
	ORDER BY [entity0].[TotalAmount] DESC
	EXCEPT
	SELECT TOP 5 [entity1].[OrderId],
		[entity1].[TotalAmount],
		[entity1].[OrderDate]
	FROM [Orders] AS [entity1]
	ORDER BY [entity1].[TotalAmount] ASC
) AS [entity0]
ORDER BY [entity0].[TotalAmount] DESC`
            );
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
                    total: (o) => Enumerable.from(o).sum((o) => o.TotalAmount),
                    qty: (o) => Enumerable.from(o).flatMap((o) => o.OrderDetails).map((o) => o.quantity).sum()
                });
            const results = await pivot.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT (MONTH([entity0].[OrderDate]) - 1) AS [column0],
	SUM([entity1].[TotalAmount]) AS [column1],
	SUM([entity2].[Quantity]) AS [column2]
FROM [Orders] AS [entity0]
LEFT JOIN [Orders] AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN (
	SELECT [entity2].[OrderDetailId],
		[entity2].[OrderId],
		[entity2].[Quantity]
	FROM [OrderDetails] AS [entity2]
	WHERE ([entity2].[isDeleted]=0)
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
GROUP BY (MONTH([entity0].[OrderDate]) - 1)`
            );
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
                qty: (o) => o.flatMap((o) => o.OrderDetails).map((o) => o.quantity).sum()
            }).filter((o) => o.month >= 10);
            const results = await pivot.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT (MONTH([entity0].[OrderDate]) - 1) AS [column0],
	SUM([entity1].[TotalAmount]) AS [column1],
	SUM([entity2].[Quantity]) AS [column2]
FROM [Orders] AS [entity0]
LEFT JOIN [Orders] AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])
LEFT JOIN (
	SELECT [entity2].[OrderDetailId],
		[entity2].[OrderId],
		[entity2].[Quantity]
	FROM [OrderDetails] AS [entity2]
	WHERE ([entity2].[isDeleted]=0)
) AS [entity2]
	ON ([entity0].[OrderId]=[entity2].[OrderId])
GROUP BY (MONTH([entity0].[OrderDate]) - 1)
HAVING ((MONTH([entity0].[OrderDate]) - 1)>=10)`
            );
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
            const parameter = db.orders.parameter({ paramObj }).filter((o) => o.OrderDate < paramObj.now);
            const results = await parameter.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE ([entity0].[OrderDate]<@param0)`
            );
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
            const parameter = db.orders.parameter({ paramObj }).filter((o) => o.OrderDate.getDate() !== paramObj.now.getDate());
            const results = await parameter.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE (DAY([entity0].[OrderDate])<>@param0)`
            );
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

            const parameter = db.orders.filter((o) => o.OrderDate < new Date());
            const results = await parameter.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE ([entity0].[OrderDate]<getdate())`
            );
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
            const parameter = await db.orders.parameter({ fn }).map((o) => fn(o));
            const results = await parameter.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	([entity0].[TotalAmount]/[entity1].[column0]) AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity1].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
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
            const parameter = await db.orders.parameter({ fn, multi }).map((o) => fn(o));
            const results = await parameter.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	(([entity0].[TotalAmount]*@param0)/[entity1].[column0]) AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity1].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity0].[OrderId]=[entity1].[OrderId])`
            );
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
                    .map((o) => fn(o.TotalAmount));
                db.connection = await db.getConnection();
                const spy = vi.spyOn(db.connection, "query");

                await where.toArray();
                if (i % 2 === 0) {
                    const param = spy.mock.calls[0][0] as unknown as IQuery;
                    expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	([entity0].[TotalAmount]+1) AS [column0]
FROM [Orders] AS [entity0]`
            );
                    expect(param.type).toBe(QueryType.DQL);
                    expect(param.parameters).toEqual(new Map());
                }
                else {

                    const param = spy.mock.calls[0][0] as unknown as IQuery;
                    expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	([entity0].[TotalAmount]-1) AS [column0]
FROM [Orders] AS [entity0]`
            );
                    expect(param.type).toBe(QueryType.DQL);
                    expect(param.parameters).toEqual(new Map());
                }
            }
        });
        it("should support null value parameter", async () => {
            let spy = vi.spyOn(db.connection, "query");

            let dd = new Date();
            let avg = db.orders.parameter({ dd }).filter((o) => o.OrderDate === dd);
            let results = await avg.toArray();

            expect(spy).toHaveBeenCalledOnce();
            let param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE ([entity0].[OrderDate]=@param0)`
            );
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
            avg = db.orders.parameter({ dd }).filter((o) => o.OrderDate === dd);
            results = await avg.toArray();

            expect(spy).toHaveBeenCalledOnce();
            param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE ([entity0].[OrderDate] IS NULL)`
            );
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

            const ad = db.orderDetails.filter((o) => o.quantity > 5).asSubquery();
            const subQuery = db.orders.parameter({ ad }).filter((o) => ad.map((od) => od.OrderId).includes(o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE [entity0].[OrderId] IN (
	SELECT DISTINCT [entity1].[OrderId]
	FROM [OrderDetails] AS [entity1]
	WHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>5))
)`
            );
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

            const ad = db.orderDetails.filter((o) => o.quantity > 5).asSubquery();
            const subQuery = db.orders.parameter({ ad }).filter((o) => ad.filter((od) => od.OrderId === o.OrderId).max((o) => o.quantity) > 10);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		MAX([entity1].[Quantity]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>5))
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity1].[column0]>10)`
            );
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

            const ad = db.orderDetails.filter((o) => o.quantity > 5).asSubquery();
            const subQuery = db.orders.parameter({ ad }).filter((o) => ad.some((od) => od.OrderId === o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		1 AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>5))
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity1].[column0] IS NOT NULL)`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => ad.filter((od) => od.quantity > 1 && od.OrderId === o.OrderId).count() > 1);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity1].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE (([entity1].[isDeleted]=0) AND ([entity1].[Quantity]>1))
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity1].[column0]>1)`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => o.TotalAmount <= 20000).map((o) => ({
                orderDetails: ad.filter((od) => od.OrderId === o.OrderId).toArray()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity1].[OrderDetailId],
	[entity1].[OrderId],
	[entity1].[ProductId],
	[entity1].[ProductName],
	[entity1].[Quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM [OrderDetails] AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId]
	FROM [Orders] AS [entity0]
	WHERE ([entity0].[TotalAmount]<=20000)
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity1].[isDeleted]=0);

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]
WHERE ([entity0].[TotalAmount]<=20000)`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => o.TotalAmount <= 20000).map((o) => ({
                orderDetails: ad.filter((od) => od.OrderId === o.OrderId).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity1].[column0] AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity1].[OrderDetailId]) AS [column0]
	FROM [OrderDetails] AS [entity1]
	WHERE ([entity1].[isDeleted]=0)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity0].[TotalAmount]<=20000)`
            );
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
            const subQuery = ad.parameter({ ads }).map((o) => ({
                TotalAmount: o.TotalAmount,
                Count: ads.filter((od) => o.TotalAmount >= od.TotalAmount).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT [entity0].[OrderId],
	[entity0].[TotalAmount] AS [column0],
	[entity2].[column2] AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		SUM([entity1].[column1]) AS [column2]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[TotalAmount],
			COUNT([entity1].[OrderId]) AS [column1]
		FROM [Orders] AS [entity1]
		GROUP BY [entity1].[TotalAmount]
	) AS [entity1]
		ON ([entity2].[TotalAmount]>=[entity1].[TotalAmount])
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[TotalAmount] ASC`
            );
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
            const subQuery = ad.take(10).parameter({ ads }).map((o) => ({
                OrderId: o.OrderId,
                TotalAmount: o.TotalAmount,
                Accumulated: ads.filter((od) => od.OrderDate >= o.OrderDate).sum((o) => o.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT TOP 10 [entity0].[OrderId],
	[entity0].[OrderId] AS [column0],
	[entity0].[TotalAmount] AS [column1],
	[entity2].[column3] AS [column4]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		SUM([entity1].[column2]) AS [column3]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[OrderDate],
			SUM([entity1].[TotalAmount]) AS [column2]
		FROM [Orders] AS [entity1]
		GROUP BY [entity1].[OrderDate]
	) AS [entity1]
		ON ([entity1].[OrderDate]>=[entity2].[OrderDate])
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[OrderDate] DESC`
            );
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
            const subQuery = ad.take(10).parameter({ ads }).map((o) => ({
                TotalAmount: o.TotalAmount,
                IsNotLowest: ads.filter((od) => o.TotalAmount > od.TotalAmount).some()
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT TOP 10 [entity0].[OrderId],
	[entity0].[TotalAmount] AS [column0],
	(
	CASE WHEN (([entity2].[column2]=1)) 
	THEN 1
	ELSE 0
	END
) AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		(
		CASE WHEN ((SUM([entity1].[column1]) IS NOT NULL)) 
		THEN 1
		ELSE 0
		END
	) AS [column2]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[TotalAmount],
			1 AS [column1]
		FROM [Orders] AS [entity1]
		GROUP BY [entity1].[TotalAmount]
	) AS [entity1]
		ON ([entity2].[TotalAmount]>[entity1].[TotalAmount])
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[TotalAmount] ASC`
            );
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
            const subQuery = ad.take(10).parameter({ ads }).map((o) => ({
                TotalAmount: o.TotalAmount,
                IsHighest: ads.every((od) => o.TotalAmount >= od.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`SELECT TOP 10 [entity0].[OrderId],
	[entity0].[TotalAmount] AS [column0],
	(
	CASE WHEN (([entity2].[column2]=1)) 
	THEN 1
	ELSE 0
	END
) AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		(
		CASE WHEN ((SUM([entity1].[column1]) IS NULL)) 
		THEN 1
		ELSE 0
		END
	) AS [column2]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[TotalAmount],
			0 AS [column1]
		FROM [Orders] AS [entity1]
		GROUP BY [entity1].[TotalAmount]
	) AS [entity1]
		ON NOT(
		NOT(
			([entity2].[TotalAmount]>=[entity1].[TotalAmount])
		)
	)
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[TotalAmount] DESC`
            );
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
            }).filter((o) => ad.map((od) => od.OrderId).includes(o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ad1
(
	[__index] decimal(18, 0),
	[OrderId] uniqueidentifier
);

INSERT INTO #ad1([__index], [OrderId]) VALUES
	(0,'C7438661-DD97-4099-A370-053A72F4C706');

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
WHERE [entity0].[OrderId] IN (
	SELECT DISTINCT [entity1].[OrderId]
	FROM #ad1 AS [entity1]
);

DROP TABLE #ad1`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => ad.filter((od) => od.OrderId === o.OrderId).max((o) => o.quantity) > 10);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ad1
(
	[__index] decimal(18, 0),
	[OrderDetailId] nvarchar(255),
	[OrderId] nvarchar(255),
	[ProductId] nvarchar(255),
	[name] nvarchar(255),
	[quantity] decimal(18, 0),
	[CreatedDate] nvarchar(255),
	[isDeleted] nvarchar(255)
);

INSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES
	(0,'648F644D-EB4A-4200-91AD-13694EEF1CAB','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E58','Product 1',1,'2017-02-22T23:03:39.737Z',0);

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		MAX([entity1].[quantity]) AS [column0]
	FROM #ad1 AS [entity1]
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity1].[column0]>10);

DROP TABLE #ad1`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => ad.some((od) => od.OrderId === o.OrderId));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ad1
(
	[__index] decimal(18, 0),
	[OrderDetailId] nvarchar(255),
	[OrderId] nvarchar(255),
	[ProductId] nvarchar(255),
	[name] nvarchar(255),
	[quantity] decimal(18, 0),
	[CreatedDate] nvarchar(255),
	[isDeleted] nvarchar(255)
);

INSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES
	(0,'648F644D-EB4A-4200-91AD-13694EEF1CAB','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E58','Product 1',1,'2017-02-22T23:03:39.737Z',0);

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		1 AS [column0]
	FROM #ad1 AS [entity1]
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity1].[column0] IS NOT NULL);

DROP TABLE #ad1`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => ad.filter((od) => od.quantity > 1 && od.OrderId === o.OrderId).count() > 1);
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ad1
(
	[__index] decimal(18, 0),
	[OrderDetailId] nvarchar(255),
	[OrderId] nvarchar(255),
	[ProductId] nvarchar(255),
	[name] nvarchar(255),
	[quantity] decimal(18, 0),
	[CreatedDate] nvarchar(255),
	[isDeleted] nvarchar(255)
);

INSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES
	(0,'648F644D-EB4A-4200-91AD-13694EEF1CAB','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E58','Product 1',1,'2017-02-22T23:03:39.737Z',0);

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount],
	[entity0].[OrderDate]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity1].[__index]) AS [column0]
	FROM #ad1 AS [entity1]
	WHERE ([entity1].[quantity]>1)
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity1].[column0]>1);

DROP TABLE #ad1`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => o.TotalAmount <= 20000).map((o) => ({
                orderDetails: ad.filter((od) => od.OrderId === o.OrderId)
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ad1
(
	[__index] decimal(18, 0),
	[OrderDetailId] nvarchar(255),
	[OrderId] nvarchar(255),
	[ProductId] nvarchar(255),
	[name] nvarchar(255),
	[quantity] decimal(18, 0),
	[CreatedDate] nvarchar(255),
	[isDeleted] nvarchar(255)
);

INSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES
	(0,'E4EB9FA2-C834-40BA-A1C7-8109EEFD0FC6','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E59','Product 2',2,'2017-02-22T23:03:39.737Z',0);

SELECT [entity1].[__index],
	[entity1].[OrderId],
	[entity1].[OrderDetailId],
	[entity1].[ProductId],
	[entity1].[name],
	[entity1].[quantity],
	[entity1].[CreatedDate],
	[entity1].[isDeleted]
FROM #ad1 AS [entity1]
INNER JOIN (
	SELECT [entity0].[OrderId]
	FROM [Orders] AS [entity0]
	WHERE ([entity0].[TotalAmount]<=20000)
) AS [entity0] ON ([entity1].[OrderId]=[entity0].[OrderId]);

SELECT [entity0].[OrderId]
FROM [Orders] AS [entity0]
WHERE ([entity0].[TotalAmount]<=20000);

DROP TABLE #ad1`
            );
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
            const subQuery = db.orders.parameter({ ad }).filter((o) => o.TotalAmount <= 20000).map((o) => ({
                orderDetails: ad.filter((od) => od.OrderId === o.OrderId).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ad1
(
	[__index] decimal(18, 0),
	[OrderDetailId] nvarchar(255),
	[OrderId] nvarchar(255),
	[ProductId] nvarchar(255),
	[name] nvarchar(255),
	[quantity] decimal(18, 0),
	[CreatedDate] nvarchar(255),
	[isDeleted] nvarchar(255)
);

INSERT INTO #ad1([__index], [OrderDetailId], [OrderId], [ProductId], [name], [quantity], [CreatedDate], [isDeleted]) VALUES
	(0,'E4EB9FA2-C834-40BA-A1C7-8109EEFD0FC6','C7438661-DD97-4099-A370-053A72F4C706','BE019609-99E0-4EF5-85BB-AD90DC302E59','Product 2',2,'2017-02-22T23:03:39.737Z',0);

SELECT [entity0].[OrderId],
	[entity1].[column0] AS [column1]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity1].[OrderId],
		COUNT([entity1].[__index]) AS [column0]
	FROM #ad1 AS [entity1]
	GROUP BY [entity1].[OrderId]
) AS [entity1]
	ON ([entity1].[OrderId]=[entity0].[OrderId])
WHERE ([entity0].[TotalAmount]<=20000);

DROP TABLE #ad1`
            );
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
            const subQuery = ad.parameter({ ads }).map((o) => ({
                TotalAmount: o.TotalAmount,
                Count: ads.filter((od) => o.TotalAmount >= od.TotalAmount).count()
            }));
            const results = await subQuery.toArray();

            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ads1
(
	[__index] decimal(18, 0),
	[OrderId] nvarchar(255),
	[TotalAmount] decimal(18, 0),
	[OrderDate] nvarchar(255)
);

INSERT INTO #ads1([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES
	(0,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z'),
	(1,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z');

SELECT [entity0].[OrderId],
	[entity0].[TotalAmount] AS [column0],
	[entity2].[column2] AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		SUM([entity1].[column1]) AS [column2]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[TotalAmount],
			COUNT([entity1].[__index]) AS [column1]
		FROM #ads1 AS [entity1]
		GROUP BY [entity1].[TotalAmount]
	) AS [entity1]
		ON ([entity2].[TotalAmount]>=[entity1].[TotalAmount])
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[TotalAmount] ASC;

DROP TABLE #ads1`
            );
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
            const subQuery = ad.take(10).parameter({ ads }).map((o) => ({
                OrderId: o.OrderId,
                TotalAmount: o.TotalAmount,
                Accumulated: Enumerable.from(ads).filter((od) => od.OrderDate >= o.OrderDate).sum((o) => o.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ads2
(
	[__index] decimal(18, 0),
	[OrderId] nvarchar(255),
	[TotalAmount] decimal(18, 0),
	[OrderDate] nvarchar(255)
);

INSERT INTO #ads2([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES
	(0,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z'),
	(1,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z');

SELECT TOP 10 [entity0].[OrderId],
	[entity0].[OrderId] AS [column0],
	[entity0].[TotalAmount] AS [column1],
	[entity2].[column3] AS [column4]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		SUM([entity1].[column2]) AS [column3]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[OrderDate],
			SUM([entity1].[TotalAmount]) AS [column2]
		FROM #ads2 AS [entity1]
		GROUP BY [entity1].[OrderDate]
	) AS [entity1]
		ON ([entity1].[OrderDate]>=[entity2].[OrderDate])
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[OrderDate] DESC;

DROP TABLE #ads2`
            );
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
            const ads = Enumerable.from([
                new Order({ OrderId: "57CE0F63-AFD3-4A04-A07E-0392C87AE381", TotalAmount: 13200, OrderDate: "2017-01-19T02:08:41.530Z" }),
                new Order({ OrderId: "C7438661-DD97-4099-A370-053A72F4C706", TotalAmount: 71000, OrderDate: "2017-02-22T23:03:39.447Z" })
            ]);
            const subQuery = ad.take(10).parameter({ ads }).map((o) => ({
                TotalAmount: o.TotalAmount,
                IsNotLowest: ads.filter((od) => o.TotalAmount > od.TotalAmount).some()
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ads2
(
	[__index] decimal(18, 0),
	[OrderId] nvarchar(255),
	[TotalAmount] decimal(18, 0),
	[OrderDate] nvarchar(255)
);

INSERT INTO #ads2([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES
	(0,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z'),
	(1,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z');

SELECT TOP 10 [entity0].[OrderId],
	[entity0].[TotalAmount] AS [column0],
	(
	CASE WHEN (([entity2].[column2]=1)) 
	THEN 1
	ELSE 0
	END
) AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		(
		CASE WHEN ((SUM([entity1].[column1]) IS NOT NULL)) 
		THEN 1
		ELSE 0
		END
	) AS [column2]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[TotalAmount],
			1 AS [column1]
		FROM #ads2 AS [entity1]
		GROUP BY [entity1].[TotalAmount]
	) AS [entity1]
		ON ([entity2].[TotalAmount]>[entity1].[TotalAmount])
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[TotalAmount] ASC;

DROP TABLE #ads2`
            );
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
            const subQuery = ad.take(10).parameter({ ads }).map((o) => ({
                TotalAmount: o.TotalAmount,
                IsHighest: ads.every((od) => o.TotalAmount >= od.TotalAmount)
            }));
            const results = await subQuery.toArray();

            expect(spy).toHaveBeenCalledOnce();
            const param = spy.mock.calls[0][0] as unknown as IQuery;
            expect(param.query).toBe(
`CREATE TABLE #ads2
(
	[__index] decimal(18, 0),
	[OrderId] nvarchar(255),
	[TotalAmount] decimal(18, 0),
	[OrderDate] nvarchar(255)
);

INSERT INTO #ads2([__index], [OrderId], [TotalAmount], [OrderDate]) VALUES
	(0,'C7438661-DD97-4099-A370-053A72F4C706',71000,'2017-02-22T23:03:39.447Z'),
	(1,'57CE0F63-AFD3-4A04-A07E-0392C87AE381',13200,'2017-01-19T02:08:41.530Z');

SELECT TOP 10 [entity0].[OrderId],
	[entity0].[TotalAmount] AS [column0],
	(
	CASE WHEN (([entity2].[column2]=1)) 
	THEN 1
	ELSE 0
	END
) AS [column3]
FROM [Orders] AS [entity0]
LEFT JOIN (
	SELECT [entity2].[OrderId],
		(
		CASE WHEN ((SUM([entity1].[column1]) IS NULL)) 
		THEN 1
		ELSE 0
		END
	) AS [column2]
	FROM [Orders] AS [entity2]
	LEFT JOIN (
		SELECT [entity1].[TotalAmount],
			0 AS [column1]
		FROM #ads2 AS [entity1]
		GROUP BY [entity1].[TotalAmount]
	) AS [entity1]
		ON NOT(
		NOT(
			([entity2].[TotalAmount]>=[entity1].[TotalAmount])
		)
	)
	GROUP BY [entity2].[OrderId]
) AS [entity2]
	ON ([entity2].[OrderId]=[entity0].[OrderId])
ORDER BY [entity0].[TotalAmount] DESC;

DROP TABLE #ads2`
            );
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
            expect(param.query).toBe(
`SELECT [entity0].[OrderDetailId],
	[entity0].[OrderId],
	[entity0].[ProductId],
	[entity0].[ProductName],
	[entity0].[Quantity],
	[entity0].[CreatedDate],
	[entity0].[isDeleted]
FROM [OrderDetails] AS [entity0]`
            );
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
    //         const ternary = db.orders.map(o => ({
    //             item: o.TotalAmount > 20000 ? 20000 : o.TotalAmount
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 2", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.map(o => ({
    //             item: o.quantity === 1 ? o.Order : null
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 3", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.map(o => ({
    //             item: o.quantity === 1 ? o.Order : { OrderId: o.OrderId }
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 4", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.map(o => ({
    //             item: o.OrderDate.getDate() === 1 ? o.OrderDetails : null
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 5", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.map(o => ({
    //             item: o.OrderDate.getDate() === 1 ? o.OrderDetails.first() : o.OrderDate
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 6", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orderDetails.map(o => ({
    //             item: o.quantity === 1 ? o.OrderDetailProperties : o.Product
    //         }));
    //         const results = await ternary.toArray();
    //     });
    //     it("test 7", async () => {
    //         const spy = vi.spyOn(db.connection, "query");
    //         const ternary = db.orders.map(o => ({
    //             item: o.OrderDetails
    //         })).map(o => o.item.count());
    //         const results = await ternary.toArray();
    //     });
    // });
});

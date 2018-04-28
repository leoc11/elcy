import { IncludeQueryable } from "../src/Queryable/IncludeQueryable";
import { MyDb } from "./Common/MyDb";
import { FunctionExpression, MemberAccessExpression, ParameterExpression, MethodCallExpression, ObjectValueExpression, AdditionExpression, ValueExpression, LessEqualExpression, MultiplicationExpression } from "../src/ExpressionBuilder/Expression";
import { Order, OrderDetail, Product, OrderDetailProperty } from "./Common/Model";
import "mocha";
import "../src/Extensions/DateExtension";
import { expect, should } from "chai";
import { SelectQueryable, WhereQueryable, OrderQueryable } from "../src/Queryable";
import { IQueryableOrderDefinition } from "../src/Queryable/Interface/IQueryableOrderDefinition";
import { OrderDirection } from "../src/Common/Type";

const param = new ParameterExpression("o", Order);
const odParam = new ParameterExpression("od", OrderDetail);
describe("INCLUDE", () => {
    it("should project specific property", async () => {
        const db = new MyDb();
        const projection = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "TotalAmount"), [param])]);
        const queryString = projection.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount]\nFROM [Orders] AS [entity0]"
            , "query not equals");

        const a = await projection.toArray();
        expect(a).length.greaterThan(0);
        expect(a[0]).has.property("TotalAmount").not.equal(undefined);
        expect(a[0].OrderDate).equal(undefined);
    });
    it("should eager load list navigation property", async () => {
        const db = new MyDb();
        const include = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param])]);
        const queryString = include.toString();

        expect(queryString).equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[TotalAmount] bigint,\n\t[OrderDate] datetime\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderId] = [entity2].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);"
            , "query not equals");

        const a = await include.toArray();
        expect(a).length.greaterThan(0);
        expect(a[0]).instanceof(Order);
        expect(a[0]).property("OrderDetails").instanceof(Array, "OrderDetails not loaded");
    });
    it("should support nested include", async () => {
        const db = new MyDb();
        const pa = new MemberAccessExpression(param, "OrderDetails");
        const pb = new FunctionExpression(new MemberAccessExpression(odParam, "Product"), [odParam]);
        const pa1 = new FunctionExpression(new MethodCallExpression(pa, "include", [pb]), [param]);
        const include = new IncludeQueryable(db.orders, [pa1]);
        const queryString = include.toString();

        should();
        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[TotalAmount] bigint,\n\t[OrderDate] datetime\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nDECLARE @temp_entity1  TABLE\n(\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[ProductName] nvarchar(255),\n\t[Quantity] float,\n\t[CreatedDate] datetime,\n\t[isDeleted] bit\n);\nINSERT INTO @temp_entity1\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);\nSELECT * FROM @temp_entity1;\n\nSELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN @temp_entity1 AS [entity4]\n\tON [entity2].[ProductId] = [entity4].[ProductId];;"
            , "query not equals");

        const a = await include.toArray();

        a.should.be.an("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
        a[0].should.has.property("OrderDetails").which.is.an.instanceof(Array);
        a[0].OrderDetails[0].should.be.instanceof(OrderDetail).and.has.property("Product").which.is.an.instanceof(Product);
    });
    it("should eager load scalar navigation property", async () => {
        const db = new MyDb();
        const include = new IncludeQueryable(db.orderDetails, [new FunctionExpression(new MemberAccessExpression(odParam, "Order"), [odParam])]);

        const queryString = include.toString();
        expect(queryString).equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[ProductName] nvarchar(255),\n\t[Quantity] float,\n\t[CreatedDate] datetime,\n\t[isDeleted] bit\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n);\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderId] = [entity2].[OrderId];"
            , "query not equals");

        const a = await include.toArray();
        expect(a).length.greaterThan(0);
        expect(a[0]).instanceof(OrderDetail);
        a[0].should.has.property("Order").that.is.an.instanceof(Order);
    });
    it("should eager load 2 navigation properties at once", async () => {
        const db = new MyDb();
        const a1 = new FunctionExpression(new MemberAccessExpression(odParam, "Order"), [odParam]);
        const b = new FunctionExpression(new MemberAccessExpression(odParam, "Product"), [odParam]);
        const include = new IncludeQueryable(db.orderDetails, [a1, b]);

        const queryString = include.toString();
        expect(queryString).equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255),\n\t[ProductName] nvarchar(255),\n\t[Quantity] float,\n\t[CreatedDate] datetime,\n\t[isDeleted] bit\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n);\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId];\n\nSELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity2].[ProductId] = [entity3].[ProductId];"
            , "query not equals");

        const a = await include.toArray();
        expect(a).length.greaterThan(0);
        expect(a[0]).instanceof(OrderDetail);
        a[0].should.has.property("Order").that.is.an.instanceof(Order);
        a[0].should.has.property("Product").that.is.an.instanceof(Product);
    });
});
describe("SELECT", async () => {
    it("should return specific property", async () => {
        const db = new MyDb();
        const selectFn = new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]);
        const select = new SelectQueryable(db.orders, selectFn);
        const queryString = select.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Date);
    });
    it("should return an object", async () => {
        const db = new MyDb();
        const selectFn = new FunctionExpression(new ObjectValueExpression({
            date: new MemberAccessExpression(param, "OrderDate"),
            amount: new AdditionExpression(new MemberAccessExpression(param, "TotalAmount"), new ValueExpression(1.2))
        }), [param]);
        const select = new SelectQueryable(db.orders, selectFn);
        const queryString = select.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[OrderDate],\n\t([entity0].[TotalAmount] + 1.2) AS [amount]\nFROM [Orders] AS [entity0]"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.keys(["date", "amount"])
            .with.property("date").which.is.an.instanceof(Date);
        a[0].should.has.property("amount").which.is.a("number");
    });
    it("should return a value from scalar navigation property", async () => {
        const db = new MyDb();
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            date: new MemberAccessExpression(new MemberAccessExpression(odParam, "Order"), "OrderDate"),
        }), [odParam]);
        const select = new SelectQueryable(db.orderDetails, selectFn1);
        const queryString = select.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDetailId],\n\t[entity1].[OrderDate]\nFROM [OrderDetails] AS [entity0]\nINNER JOIN [Orders] AS [entity1]\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.has.keys(["date"])
            .with.property("date").which.is.an.instanceof(Date);
    });
    it("should return an object with list navigation property", async () => {
        const db = new MyDb();
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            ods: new MemberAccessExpression(param, "OrderDetails"),
        }), [param]);
        const select = new SelectQueryable(db.orders, selectFn1);
        const queryString = select.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderId] = [entity2].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.has.keys(["ods"])
            .with.property("ods").which.is.an("array")
            .with.deep.property("0").instanceof(OrderDetail);
    });
    it("should return an object with scalar navigation property", async () => {
        const db = new MyDb();
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            prod: new MemberAccessExpression(odParam, "Product"),
        }), [odParam]);
        const select = new SelectQueryable(db.orderDetails, selectFn1);
        const queryString = select.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderDetailId] nvarchar(255),\n\t[ProductId] nvarchar(255)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderDetailId],\n\t[entity0].[ProductId]\nFROM [OrderDetails] AS [entity0]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n);\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[ProductId],\n\t[entity1].[Price]\nFROM [Products] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[ProductId] = [entity2].[ProductId];"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.has.property("prod").which.is.an.instanceof(Product);
    });
    it("should return an value from list navigation property", async () => {
        const db = new MyDb();
        const innerSelect = new FunctionExpression(new ObjectValueExpression({
            name: new MemberAccessExpression(odParam, "name")
        }), [odParam]);
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            simpleOrderDetails: new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "select", [innerSelect]),
        }), [param]);
        const select = new SelectQueryable(db.orders, selectFn1);
        const queryString = select.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductName]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderId] = [entity2].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.has.deep.property("simpleOrderDetails").which.is.an("array");
        (a[0].simpleOrderDetails as any)[0].should.has.property("name").which.is.a("string");
    });
    it("should return a scalor navigation property of list navigation property", async () => {
        const db = new MyDb();
        const innerSelect = new FunctionExpression(new ObjectValueExpression({
            prod: new MemberAccessExpression(odParam, "Product")
        }), [odParam]);
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            simpleOrderDetails: new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "select", [innerSelect]),
        }), [param]);
        const select = new SelectQueryable(db.orders, selectFn1);
        const queryString = select.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nDECLARE @temp_entity1  TABLE\n(\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[ProductId] nvarchar(255)\n);\nINSERT INTO @temp_entity1\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);\nSELECT * FROM @temp_entity1;\n\nSELECT [entity2].[ProductId],\n\t[entity2].[Price]\nFROM [Products] AS [entity2]\nINNER JOIN @temp_entity1 AS [entity4]\n\tON [entity2].[ProductId] = [entity4].[ProductId];;"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.has.property("simpleOrderDetails").which.is.an("array");
        (a[0].simpleOrderDetails as any)[0].should.has.property("prod").which.is.an.instanceof(Product);
    });
    it("should support self select", async () => {
        const db = new MyDb();
        const innerSelect = new FunctionExpression(new ObjectValueExpression({
            od: odParam,
            Price: new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price")
        }), [odParam]);
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            simpleOrderDetails: new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "select", [innerSelect]),
        }), [param]);
        const select = new SelectQueryable(db.orders, selectFn1);
        const queryString = select.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nDECLARE @temp_entity1  TABLE\n(\n\t[OrderDetailId] nvarchar(255),\n\t[OrderId] nvarchar(255),\n\t[Price] bigint\n);\nINSERT INTO @temp_entity1\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity2].[Price]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Products] AS [entity2]\n\tON [entity1].[ProductId] = [entity2].[ProductId]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);\nSELECT * FROM @temp_entity1;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity1 AS [entity4]\n\tON [entity1].[OrderDetailId] = [entity4].[OrderDetailId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);;"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.has.deep.property("simpleOrderDetails").which.is.an("array");
        (a[0].simpleOrderDetails as any)[0].should.has.property("od").which.is.an.instanceof(OrderDetail);
        (a[0].simpleOrderDetails as any)[0].should.has.property("Price").which.is.a("number");
    });
    it("should select array", async () => {
        const db = new MyDb();
        const select = await db.orders.select(o => o.OrderDetails);
        const queryString = select.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderId] = [entity2].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.be.a("array").with.length.greaterThan(0);
        a[0][0].should.be.an.instanceof(OrderDetail);
    });
    it("should select array with where for aggregate", async () => {
        const db = new MyDb();
        const select = await db.orders.select(o => ({
            sum: o.OrderDetails.where(p => p.quantity > 2).sum(o => o.quantity),
            ods: o.OrderDetails.where(p => p.quantity <= 1)
        }));
        const queryString = select.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[column0] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity1].[column0]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tSUM([entity1].[Quantity]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE (NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t) AND ([entity1].[Quantity] > 2))\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity2].[OrderDetailId],\n\t[entity2].[OrderId],\n\t[entity2].[ProductId],\n\t[entity2].[ProductName],\n\t[entity2].[Quantity],\n\t[entity2].[CreatedDate],\n\t[entity2].[isDeleted]\nFROM [OrderDetails] AS [entity2]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity2].[OrderId] = [entity3].[OrderId]\nWHERE (NOT(\n\t([entity2].[isDeleted] = CAST (1 AS BIT))\n) AND ([entity2].[Quantity] <= 1));"
            , "query not equals");

        const a = await select.toArray();
        should();
        a.should.be.a("array").with.length.greaterThan(0);
        a[0].should.have.keys(["sum", "ods"]).with.property("sum").which.is.a("number");
        a[0].should.have.property("ods").which.is.an("array");
        (a[0].ods as any)[0].should.be.an.instanceof(OrderDetail);
    });
});
describe("WHERE", async () => {
    it("should add where clause", async () => {
        const db = new MyDb();
        const predicate = new FunctionExpression(
            new LessEqualExpression(
                new MemberAccessExpression(param, "TotalAmount"),
                new ValueExpression(10000)),
            [param]);
        const where = new WhereQueryable(db.orders, predicate);
        const queryString = where.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[TotalAmount] <= 10000)"
            , "query not equals");

        const a = await where.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
    it("should filter included list", async () => {
        const db = new MyDb();
        const predicate = new FunctionExpression(
            new LessEqualExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                new ValueExpression(15000)),
            [odParam]);
        const whereExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "where", [predicate]);
        const where = new IncludeQueryable(db.orders, [new FunctionExpression(whereExp, [param])]);
        const queryString = where.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[TotalAmount] bigint,\n\t[OrderDate] datetime\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Products] AS [entity2]\n\tON [entity1].[ProductId] = [entity2].[ProductId]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId]\nWHERE (NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n) AND ([entity2].[Price] <= 15000));"
            , "query not equals");

        const a = await where.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order).and.has.property("OrderDetails").which.is.an("array");
        a[0].OrderDetails[0].should.be.instanceof(OrderDetail);
    });
    it("should be supported in select statement", async () => {
        const db = new MyDb();
        const predicate = new FunctionExpression(
            new LessEqualExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                new ValueExpression(15000)),
            [odParam]);
        const whereExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "where", [predicate]);
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            ods: whereExp,
        }), [param]);
        const where = new SelectQueryable(db.orders, selectFn1);
        const queryString = where.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN [Products] AS [entity2]\n\tON [entity1].[ProductId] = [entity2].[ProductId]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId]\nWHERE (NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n) AND ([entity2].[Price] <= 15000));"
            , "query not equals");

        const a = await where.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("ods").which.is.an("array");
        (a[0].ods as any)[0].should.be.instanceof(OrderDetail);
    });
    it("could be used multiple times", async () => {
        const db = new MyDb();
        let predicate = new FunctionExpression(
            new LessEqualExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                new ValueExpression(15000)),
            [odParam]);
        let where = new WhereQueryable(db.orderDetails, predicate);
        predicate = new FunctionExpression(
            new MethodCallExpression(
                new MemberAccessExpression(odParam, "name"),
                "like", [new ValueExpression("%a%")]),
            [odParam]);
        where = new WhereQueryable(where, predicate);
        const queryString = where.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nINNER JOIN [Products] AS [entity1]\n\tON [entity0].[ProductId] = [entity1].[ProductId]\nWHERE ((NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n) AND ([entity1].[Price] <= 15000)) AND ([entity0].[ProductName] LIKE '%a%'))"
            , "query not equals");

        const a = await where.toArray();
        should();
        a.should.be.an("array").and.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(OrderDetail);
    });
    it("could be used more than once in chain", async () => {
        const db = new MyDb();
        let predicate = new FunctionExpression(
            new LessEqualExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                new ValueExpression(15000)),
            [odParam]);
        let where = new WhereQueryable(db.orderDetails, predicate);
        predicate = new FunctionExpression(
            new MethodCallExpression(
                new MemberAccessExpression(odParam, "name"),
                "like", [new ValueExpression("%a%")]),
            [odParam]);
        where = new WhereQueryable(where, predicate);
        const queryString = where.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nINNER JOIN [Products] AS [entity1]\n\tON [entity0].[ProductId] = [entity1].[ProductId]\nWHERE ((NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n) AND ([entity1].[Price] <= 15000)) AND ([entity0].[ProductName] LIKE '%a%'))"
            , "query not equals");

        const a = await where.toArray();
        should();
        a.should.be.an("array").and.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(OrderDetail);
    });
    it("work with groupBy", async () => {
        const db = new MyDb();
        let where = db.orders.where(o => o.TotalAmount > 20000).groupBy(o => o.OrderDate)
            .where(o => o.count() >= 1)
            .select(o => o.key).where(o => o.getDate() > 15).orderBy({ selector: o => o });
        const queryString = where.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[TotalAmount] > 20000)\nGROUP BY [entity0].[OrderDate]\nHAVING ((COUNT(*) >= 1) AND (DAY([entity0].[OrderDate]) > 15))\nORDER BY [entity0].[OrderDate] ASC"
            , "query not equals");

        const a = await where.toArray();
        should();
        a.should.be.an("array").and.has.length.greaterThan(0);
        a[0].should.be.an("date");
    });
});
describe("ORDER BY", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const selector: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MemberAccessExpression(param, "TotalAmount"),
                [param]),
            direction: OrderDirection.DESC
        };
        const order = new OrderQueryable(db.orders, selector);
        const queryString = order.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nORDER BY [entity0].[TotalAmount] DESC"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
    it("by related entity", async () => {
        const db = new MyDb();
        const selector: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                [odParam]),
            direction: OrderDirection.DESC
        };
        const order = new OrderQueryable(db.orderDetails, selector);
        const queryString = order.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON [entity0].[ProductId] = [entity1].[ProductId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nORDER BY [entity1].[Price] DESC"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(OrderDetail);
    });
    it("by computed column", async () => {
        const db = new MyDb();
        const selector: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MultiplicationExpression(new MemberAccessExpression(odParam, "quantity"), new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price")),
                [odParam]),
            direction: OrderDirection.DESC
        };
        const order = new OrderQueryable(db.orderDetails, selector);
        const queryString = order.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON [entity0].[ProductId] = [entity1].[ProductId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nORDER BY ([entity0].[Quantity] * [entity1].[Price]) DESC"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(OrderDetail);
    });
    it("by multiple column", async () => {
        const db = new MyDb();
        const selector: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MemberAccessExpression(odParam, "quantity"),
                [odParam])
        };
        const selector2: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                [odParam]),
            direction: OrderDirection.DESC
        };
        const order = new OrderQueryable(db.orderDetails, ...[selector, selector2]);
        const queryString = order.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON [entity0].[ProductId] = [entity1].[ProductId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nORDER BY [entity0].[Quantity] ASC, [entity1].[Price] DESC"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(OrderDetail);
    });
    it("should used last defined order", async () => {
        const db = new MyDb();
        // Note: thought Product no longer used, it still exist in join statement.
        const selector: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                [odParam]),
            direction: OrderDirection.DESC
        };
        let order = new OrderQueryable(db.orderDetails, selector);
        const selector2: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MemberAccessExpression(odParam, "quantity"),
                [odParam])
        };
        order = new OrderQueryable(order, selector2);
        const queryString = order.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDetailId],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN [Products] AS [entity1]\n\tON [entity0].[ProductId] = [entity1].[ProductId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nORDER BY [entity0].[Quantity] ASC"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(OrderDetail);
    });
    it("could be used in include", async () => {
        const db = new MyDb();
        const selector = new ObjectValueExpression({
            selector: new FunctionExpression(
                new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
                [odParam]),
            direction: new ValueExpression(OrderDirection.DESC)
        });
        const orderExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "orderBy", [selector]);
        const order = new IncludeQueryable(db.orders, [new FunctionExpression(orderExp, [param])]);
        const queryString = order.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[TotalAmount] bigint,\n\t[OrderDate] datetime\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nLEFT JOIN [Products] AS [entity2]\n\tON [entity1].[ProductId] = [entity2].[ProductId]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n)\nORDER BY [entity2].[Price] DESC;"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order).and.has.property("OrderDetails").which.is.an("array");
        a[0].OrderDetails[0].should.be.instanceof(OrderDetail);
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const selector = new ObjectValueExpression({
            selector: new FunctionExpression(
                new MemberAccessExpression(odParam, "quantity"),
                [odParam])
        });
        const orderExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "orderBy", [selector]);
        const selectFn1 = new FunctionExpression(new ObjectValueExpression({
            ods: orderExp,
        }), [param]);
        const order = new SelectQueryable(db.orders, selectFn1);
        const queryString = order.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderId] = [entity2].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n)\nORDER BY [entity1].[Quantity] ASC;"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("ods").which.is.an("array");
        (a[0].ods as any)[0].should.be.an.instanceof(OrderDetail);
    });
});
describe("SELECT MANY", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const selector: IQueryableOrderDefinition = {
            selector: new FunctionExpression(
                new MemberAccessExpression(param, "TotalAmount"),
                [param]),
            direction: OrderDirection.DESC
        };
        const order = new OrderQueryable(db.orders, selector);
        const queryString = order.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nORDER BY [entity0].[TotalAmount] DESC"
            , "query not equals");

        const a = await order.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
});
describe("ANY", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.any();
        should();
        a.should.be.a("boolean");
        a.should.equal(true);
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const any = db.orders.select(o => ({
            order: o,
            hasDetail: o.OrderDetails.any(od => od.Product.Price < 20000)
        }));
        const queryString = any.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[hasDetail] bit\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t(\n\tCASE WHEN (([column0] IS NOT NULL)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [hasDetail]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCAST (1 AS BIT) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE (NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t) AND ([entity2].[Price] < 20000))\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity0].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await any.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("hasDetail").which.is.an("boolean");
    });
    it("could be used in where", async () => {
        const db = new MyDb();
        const any = db.orders.where(o => o.OrderDetails.any());
        const queryString = any.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCAST (1 AS BIT) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE ([column0] IS NOT NULL)"
            , "query not equals");

        const a = await any.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("ALL", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.all(o => o.TotalAmount <= 20000);
        should();
        a.should.be.a("boolean");
        a.should.equal(false);
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const all = db.orders.select(o => ({
            order: o,
            hasDetail: o.OrderDetails.all(od => od.Product.Price < 20000)
        }));
        const queryString = all.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[hasDetail] bit\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t(\n\tCASE WHEN (([column0] IS NULL)) \n\tTHEN 1\n\tELSE 0\n\tEND\n) AS [hasDetail]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCAST (0 AS BIT) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE (NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t) AND NOT(\n\t\t([entity2].[Price] < 20000)\n\t))\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity0].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await all.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("hasDetail").which.is.an("boolean");
    });
    it("could be used in where", async () => {
        const db = new MyDb();
        const all = db.orders.where(o => o.OrderDetails.all(od => od.Product.Price <= 20000));
        const queryString = all.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCAST (0 AS BIT) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE (NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t) AND NOT(\n\t\t([entity2].[Price] <= 20000)\n\t))\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE ([column0] IS NULL)"
            , "query not equals");

        const a = await all.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("MAX", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.max(o => o.TotalAmount);
        should();
        a.should.be.a("number");
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const max = db.orders.select(o => ({
            order: o,
            maxProductPrice: o.OrderDetails.max(od => od.Product.Price)
        }));
        const queryString = max.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[column0] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity1].[column0]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMAX([entity2].[Price]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity0].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await max.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("maxProductPrice").which.is.an("number");
    });
    it("could be used in where", async () => {
        const db = new MyDb();
        const max = db.orders.where(o => o.OrderDetails.max(od => od.Product.Price) > 20000);
        const queryString = max.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMAX([entity2].[Price]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE ([column0] > 20000)"
            , "query not equals");

        const a = await max.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("MIN", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.min(o => o.TotalAmount);
        should();
        a.should.be.a("number");
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const min = db.orders.select(o => ({
            order: o,
            minProductPrice: o.OrderDetails.min(od => od.Product.Price)
        }));
        const queryString = min.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[column0] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity1].[column0]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMIN([entity2].[Price]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity0].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await min.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("minProductPrice").which.is.an("number");
    });
    it("could be used in where", async () => {
        const db = new MyDb();
        const min = db.orders.where(o => o.OrderDetails.min(od => od.Product.Price) > 20000);
        const queryString = min.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tMIN([entity2].[Price]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE ([column0] > 20000)"
            , "query not equals");

        const a = await min.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("AVG", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.avg(o => o.TotalAmount);
        should();
        a.should.be.a("number");
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const avg = db.orders.select(o => ({
            order: o,
            avgProductPrice: o.OrderDetails.avg(od => od.Product.Price)
        }));
        const queryString = avg.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[column0] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity1].[column0]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tAVG([entity2].[Price]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity0].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await avg.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("avgProductPrice").which.is.an("number");
    });
    it("could be used in where", async () => {
        const db = new MyDb();
        const avg = db.orders.where(o => o.OrderDetails.avg(od => od.Product.Price) > 20000);
        const queryString = avg.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tAVG([entity2].[Price]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE ([column0] > 20000)"
            , "query not equals");

        const a = await avg.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("SUM", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.sum(o => o.TotalAmount);
        should();
        a.should.be.a("number");
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const sum = db.orders.select(o => ({
            order: o,
            sumProductPrice: o.OrderDetails.sum(od => od.Product.Price * od.quantity)
        }));
        const queryString = sum.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[column1] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity1].[column1]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tSUM(([entity2].[Price] * [entity1].[Quantity])) AS [column1]\n\tFROM [OrderDetails] AS [entity1]\n\tINNER JOIN [Products] AS [entity2]\n\t\tON [entity1].[ProductId] = [entity2].[ProductId]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity0].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await sum.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("sumProductPrice").which.is.an("number");
    });
    it("could be used in where", async () => {
        const db = new MyDb();
        const sum = db.orders.where(o => o.OrderDetails.sum(od => od.quantity) > 3);
        const queryString = sum.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tSUM([entity1].[Quantity]) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE ([column0] > 3)"
            , "query not equals");

        const a = await sum.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("COUNT", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.count();
        should();
        a.should.be.a("number");
    });
    it("could be used in select", async () => {
        const db = new MyDb();
        const count = db.orders.select(o => ({
            order: o,
            countDetails: o.OrderDetails.count()
        }));
        const queryString = count.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100),\n\t[column0] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\t[entity1].[column0]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT(*) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity0].[OrderId] = [entity2].[OrderId];"
            , "query not equals");

        const a = await count.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("countDetails").which.is.an("number");
    });
    it("could be used in where", async () => {
        const db = new MyDb();
        const count = db.orders.where(o => o.OrderDetails.count() > 3);
        const queryString = count.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\tCOUNT(*) AS [column0]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity1].[OrderId]\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nWHERE ([column0] > 3)"
            , "query not equals");

        const a = await count.toArray();

        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("TAKE SKIP", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const take = db.orders.take(10).skip(4).take(2).skip(1);
        const queryString = take.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nORDER BY (SELECT NULL)\nOFFSET 5 ROWS\nFETCH NEXT 1 ROWS ONLY"
            , "query not equals");

        const a = await take.toArray();

        should();
        a.should.be.a("array").and.have.lengthOf(1);
        a[0].should.be.an.instanceof(Order);
    });
});
describe("FIRST", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const a = await db.orders.first();

        should();
        a.should.be.an.instanceof(Order);
    });
    it("should work with where", async () => {
        const db = new MyDb();
        const a = await db.orders.where(o => o.OrderDate < new Date()).first(o => o.TotalAmount > 20000);

        should();
        a.should.be.an.instanceof(Order);
    });
});
describe("DISTINCT", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const distinct = db.orders.select(o => o.TotalAmount).distinct();
        const queryString = distinct.toString();

        expect(queryString).to.equal("SELECT DISTINCT [entity0].[TotalAmount]\nFROM [Orders] AS [entity0]"
            , "query not equals");

        const a = await distinct.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.an("number");
        a.length.should.equal(a.distinct().count());
    });
    it("should work with select", async () => {
        const db = new MyDb();
        const distinct = db.orders.select(o => ({
            order: o,
            quantities: o.OrderDetails.select(p => p.quantity).distinct().toArray()
        }));
        const queryString = distinct.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(100)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId]\nFROM [Orders] AS [entity0];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity0].[OrderId] = [entity2].[OrderId];\n\nSELECT DISTINCT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[Quantity]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderId] = [entity2].[OrderId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);"
            , "query not equals");

        const a = await distinct.toArray();

        should();
        a.should.be.a("array");
        a[0].should.have.property("order").which.is.an.instanceof(Order);
        a[0].should.have.property("quantities").which.is.an("array");
        a[0].quantities.length.should.equal(a[0].quantities.distinct().count());
    });
});
describe("GROUP BY", async () => {
    it("groupBy.(o => o.column).select(o => o.key)", async () => {
        const db = new MyDb();
        const groupBy = db.orders.groupBy(o => o.OrderDate).select(o => o.key);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nGROUP BY [entity0].[OrderDate]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("date");
    });
    it("groupBy.(o => o.column).select(o => o.key.method())", async () => {
        const db = new MyDb();
        const groupBy = db.orders.groupBy(o => o.OrderDate).select(o => o.key.getDate());
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDate],\n\tDAY([entity0].[OrderDate]) AS [column0]\nFROM [Orders] AS [entity0]\nGROUP BY [entity0].[OrderDate]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("number");
    });
    it("groupBy.(o => o.column).select(o => o.count())", async () => {
        const db = new MyDb();
        const groupBy = db.orders.groupBy(o => o.OrderDate).select(o => o.count());
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderDate],\n\tCOUNT(*) AS [column0]\nFROM [Orders] AS [entity0]\nGROUP BY [entity0].[OrderDate]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("number");
    });
    it("groupBy.(o => o.column + o.column).select(o => o.key)", async () => {
        const db = new MyDb();
        const groupBy = db.orders.groupBy(o => o.OrderDate.getDate() + o.OrderDate.getFullYear()).select(o => o.key);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT (DAY([entity0].[OrderDate]) + YEAR([entity0].[OrderDate])) AS [key]\nFROM [Orders] AS [entity0]\nGROUP BY (DAY([entity0].[OrderDate]) + YEAR([entity0].[OrderDate]))"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("number");
    });
    it("groupBy.(o => o.column + o.column).select(o => {column: o.key, count: o.count(), sum: o.sum()})", async () => {
        const db = new MyDb();
        const groupBy = db.orders.groupBy(o => o.OrderDate.getDate() + o.OrderDate.getFullYear()).select(o => ({
            dateYear: o.key,
            count: o.count(),
            sum: o.where(o => o.TotalAmount < 10000).sum(o => o.TotalAmount)
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT (DAY([entity0].[OrderDate]) + YEAR([entity0].[OrderDate])) AS [key],\n\tCOUNT(*) AS [count],\n\tSUM([entity1].[TotalAmount]) AS [sum]\nFROM [Orders] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderId],\n\t\t[entity1].[TotalAmount]\n\tFROM [Orders] AS [entity1]\n\tWHERE ([entity1].[TotalAmount] < 10000)\n) AS entity1\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nGROUP BY (DAY([entity0].[OrderDate]) + YEAR([entity0].[OrderDate]))"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.has.property("dateYear").which.is.a("number");
        a[0].should.has.property("count").which.is.a("number").greaterThan(0);
        a[0].should.has.property("sum").which.is.a("number");
    });
    it("groupBy.(o => o.column.method()).select(o => ({items: o}))", async () => {
        const db = new MyDb();
        const groupBy = db.orders.groupBy(o => o.OrderDate.getDate()).select(o => ({
            details: o.toArray()
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[key] decimal\n);\nINSERT INTO @temp_entity0\nSELECT DAY([entity0].[OrderDate]) AS [key]\nFROM [Orders] AS [entity0]\nGROUP BY DAY([entity0].[OrderDate]);\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\tDAY([entity0].[OrderDate]) AS [key],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity1]\n\tON DAY([entity0].[OrderDate]) = [entity1].[key];"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.have.property("details").which.is.an("array");
        a[0].details[0].should.be.an.instanceof(Order);
    });

    it("groupBy.(o => o.toOneRelation).select(o => o.key)", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => o.Order).select(o => o.key);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity2].[OrderId],\n\t[entity2].[TotalAmount],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT [entity0].[OrderId]\n\tFROM [OrderDetails] AS [entity0]\n\tWHERE NOT(\n\t\t([entity0].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity0].[OrderId]\n) AS entity0\n\tON [entity2].[OrderId] = [entity0].[OrderId]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.an.instanceof(Order);
    });
    it("groupBy.(o => o.toOneRelation).select(o => o.key.column.method())", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => o.Order).select(o => o.key.OrderDate.getDate());
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity2].[OrderId],\n\tDAY([entity2].[OrderDate]) AS [column0]\nFROM [Orders] AS [entity2]\nINNER JOIN (\n\tSELECT [entity0].[OrderId]\n\tFROM [OrderDetails] AS [entity0]\n\tWHERE NOT(\n\t\t([entity0].[isDeleted] = CAST (1 AS BIT))\n\t)\n\tGROUP BY [entity0].[OrderId]\n) AS entity0\n\tON [entity2].[OrderId] = [entity0].[OrderId]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("number");
    });
    it("groupBy.(o => o.toOneRelation).select(o => o.count())", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => o.Order).select(o => o.count());
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\tCOUNT(*) AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY [entity0].[OrderId]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("number");
    });
    it("groupBy.(o => o.toOneRelation.toOneRelation).select(o => o.key.column)", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetailProperties.groupBy(o => o.OrderDetail.Order).select(o => o.key.OrderDate);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity3].[OrderId],\n\t[entity3].[OrderDate]\nFROM [Orders] AS [entity3]\nINNER JOIN (\n\tSELECT [entity1].[OrderId]\n\tFROM [OrderDetailProperties] AS [entity0]\n\tINNER JOIN (\n\t\tSELECT [entity1].[OrderDetailId],\n\t\t\t[entity1].[OrderId],\n\t\t\t[entity1].[ProductId],\n\t\t\t[entity1].[ProductName],\n\t\t\t[entity1].[Quantity],\n\t\t\t[entity1].[CreatedDate],\n\t\t\t[entity1].[isDeleted]\n\t\tFROM [OrderDetails] AS [entity1]\n\t\tWHERE NOT(\n\t\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t\t)\n\t) AS entity1\n\t\tON [entity0].[OrderDetailId] = [entity1].[OrderDetailId]\n\tGROUP BY [entity1].[OrderId]\n) AS entity0\n\tON [entity3].[OrderId] = [entity0].[OrderId]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("date");
    });
    it("groupBy.(o => o.toOneRelation).select(o => {col: o.key, count: o.count(), sum: o.where().sum()})", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => o.Order).select(o => ({
            order: o.key,
            count: o.count(),
            sum: o.where(o => o.quantity > 1).sum(o => o.quantity)
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(255),\n\t[count] decimal,\n\t[sum] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderId],\n\tCOUNT(*) AS [count],\n\tSUM([entity2].[Quantity]) AS [sum]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity2].[OrderDetailId],\n\t\t[entity2].[Quantity]\n\tFROM [OrderDetails] AS [entity2]\n\tWHERE ([entity2].[Quantity] > 1)\n) AS entity2\n\tON [entity0].[OrderDetailId] = [entity2].[OrderDetailId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY [entity0].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderId],\n\t[entity1].[TotalAmount],\n\t[entity1].[OrderDate]\nFROM [Orders] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("count").which.is.an("number");
        a[0].should.has.property("sum").which.is.an("number");
    });
    it("groupBy.(o => o.toOneRelation.toOneRelation).select(o => {col: o.key, count: o.count(), sum: o.where().sum()})", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetailProperties.groupBy(o => o.OrderDetail.Order).select(o => ({
            order: o.key,
            count: o.count(),
            sum: o.where(o => o.amount < 20000).sum(o => o.amount)
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(255),\n\t[count] decimal,\n\t[sum] decimal\n);\nINSERT INTO @temp_entity0\nSELECT [entity1].[OrderId],\n\tCOUNT(*) AS [count],\n\tSUM([entity3].[Amount]) AS [sum]\nFROM [OrderDetailProperties] AS [entity0]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n) AS entity1\n\tON [entity0].[OrderDetailId] = [entity1].[OrderDetailId]\nLEFT JOIN (\n\tSELECT [entity3].[OrderDetailPropertyId],\n\t\t[entity3].[Amount]\n\tFROM [OrderDetailProperties] AS [entity3]\n\tWHERE ([entity3].[Amount] < 20000)\n) AS entity3\n\tON [entity0].[OrderDetailPropertyId] = [entity3].[OrderDetailPropertyId]\nGROUP BY [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity2].[OrderId],\n\t[entity2].[TotalAmount],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN @temp_entity0 AS [entity4]\n\tON [entity2].[OrderId] = [entity4].[OrderId];"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.has.property("order").which.is.an.instanceof(Order);
        a[0].should.has.property("count").which.is.an("number");
        a[0].should.has.property("sum").which.is.an("number");
    });
    it("groupBy.(o => o.toOneRelation).select(o => o.key.toOneRelation)", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetailProperties.groupBy(o => o.OrderDetail).select(o => o.key.Order);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity3].[OrderId],\n\t[entity3].[TotalAmount],\n\t[entity3].[OrderDate]\nFROM [Orders] AS [entity3]\nINNER JOIN (\n\tSELECT [entity2].[OrderDetailId],\n\t\t[entity2].[OrderId],\n\t\t[entity2].[ProductId],\n\t\t[entity2].[ProductName],\n\t\t[entity2].[Quantity],\n\t\t[entity2].[CreatedDate],\n\t\t[entity2].[isDeleted]\n\tFROM [OrderDetails] AS [entity2]\n\tINNER JOIN (\n\t\tSELECT [entity0].[OrderDetailId]\n\t\tFROM [OrderDetailProperties] AS [entity0]\n\t\tGROUP BY [entity0].[OrderDetailId]\n\t) AS entity0\n\t\tON [entity2].[OrderDetailId] = [entity0].[OrderDetailId]\n\tWHERE NOT(\n\t\t([entity2].[isDeleted] = CAST (1 AS BIT))\n\t)\n) AS entity2\n\tON [entity3].[OrderId] = [entity2].[OrderId]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.an.instanceof(Order);
    });

    it("groupBy.(o => ({col: o.column, col: o.column*2 })).select(o => o.key)", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => ({
            productid: o.ProductId,
            Quantity: o.quantity * 2
        })).select(o => o.key);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[ProductId],\n\t([entity0].[Quantity] * 2) AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity] * 2)"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.has.property("productid").which.is.a("string");
        a[0].should.has.property("Quantity").which.is.a("number");
    });
    it("groupBy.(o => ({col: o.column, col: o.column*2 })).select(o => o.count())", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => ({
            productid: o.ProductId,
            Quantity: o.quantity * 2
        })).select(o => o.count());
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[ProductId],\n\t([entity0].[Quantity] * 2) AS [column0],\n\tCOUNT(*) AS [column1]\nFROM [OrderDetails] AS [entity0]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity] * 2)"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("number");
    });
    it("groupBy.(o => ({col: o.column, col: o.column*2 })).select(o => o.key.col)", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => ({
            productid: o.ProductId,
            Quantity: o.quantity * 2
        })).select(o => o.key.Quantity);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[ProductId],\n\t([entity0].[Quantity] * 2) AS [column0]\nFROM [OrderDetails] AS [entity0]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity] * 2)"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("number");
    });
    it("groupBy.(o => ({col: o.column, col: o.column*2 })).select(o => ({ col: { col: col }}))", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => ({
            productid: o.ProductId,
            Quantity: o.quantity * 2
        })).select(o => ({
            data: {
                pid: o.key.productid,
                qty: o.key.Quantity,
                avg: o.avg(o => o.quantity)
            },
            count: o.count(),
            sum: o.where(o => o.quantity > 1).sum(o => o.quantity)
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity0].[ProductId],\n\t([entity0].[Quantity] * 2) AS [column0],\n\tAVG([entity0].[Quantity]) AS [avg],\n\tCOUNT(*) AS [count],\n\tSUM([entity1].[Quantity]) AS [sum]\nFROM [OrderDetails] AS [entity0]\nLEFT JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[Quantity]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE ([entity1].[Quantity] > 1)\n) AS entity1\n\tON [entity0].[OrderDetailId] = [entity1].[OrderDetailId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY [entity0].[ProductId], ([entity0].[Quantity] * 2)"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.has.property("count").which.is.a("number");
        a[0].should.has.property("sum").which.is.a("number");
        a[0].data.should.has.keys(["pid", "qty", "avg"]);
    });
    it("groupBy.(o => ({col: o.toOneRelation.column.method(), col: o.toOneRelation.column })).select(o => ({ col: { col: col }}))", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => ({
            date: o.Order.OrderDate.getDate(),
            price: o.Product.Price
        })).select(o => ({
            data: {
                day: o.key.date,
                price: o.key.price,
                avg: o.avg(o => o.quantity)
            },
            count: o.count(),
            sum: o.where(o => o.quantity > 1).sum(o => o.quantity)
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT DAY([entity1].[OrderDate]) AS [column0],\n\t[entity2].[Price],\n\tAVG([entity0].[Quantity]) AS [avg],\n\tCOUNT(*) AS [count],\n\tSUM([entity3].[Quantity]) AS [sum]\nFROM [OrderDetails] AS [entity0]\nINNER JOIN [Orders] AS [entity1]\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nINNER JOIN [Products] AS [entity2]\n\tON [entity0].[ProductId] = [entity2].[ProductId]\nLEFT JOIN (\n\tSELECT [entity3].[OrderDetailId],\n\t\t[entity3].[Quantity]\n\tFROM [OrderDetails] AS [entity3]\n\tWHERE ([entity3].[Quantity] > 1)\n) AS entity3\n\tON [entity0].[OrderDetailId] = [entity3].[OrderDetailId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY DAY([entity1].[OrderDate]), [entity2].[Price]"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.has.property("count").which.is.a("number");
        a[0].should.has.property("sum").which.is.a("number");
        a[0].data.should.has.keys(["day", "price", "avg"]);
    });
    it("groupBy.(o => ({col: o.toOneRelation })).select(o => o.key).select(o => o.col.name)", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetailProperties.groupBy(o => ({
            od: o.OrderDetail
        })).select(o => o.key).select(o => o.od.name);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("SELECT [entity1].[OrderDetailId],\n\t[entity1].[ProductName]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN (\n\tSELECT [entity0].[OrderDetailId]\n\tFROM [OrderDetailProperties] AS [entity0]\n\tGROUP BY [entity0].[OrderDetailId]\n) AS entity0\n\tON [entity1].[OrderDetailId] = [entity0].[OrderDetailId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n)"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("string");
    });

    it("groupBy.(o => o.column)", async () => {
        const db = new MyDb();
        const groupBy = db.orders.where(o => o.TotalAmount > 20000).groupBy(o => o.OrderDate.getDate())
            .where(o => o.count() >= 1);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[key] decimal\n);\nINSERT INTO @temp_entity0\nSELECT DAY([entity0].[OrderDate]) AS [key]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[TotalAmount] > 20000)\nGROUP BY DAY([entity0].[OrderDate])\nHAVING (COUNT(*) >= 1);\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderId],\n\tDAY([entity0].[OrderDate]) AS [key],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity1]\n\tON DAY([entity0].[OrderDate]) = [entity1].[key]\nWHERE ([entity0].[TotalAmount] > 20000);"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("array").with.property("key").which.is.a("number");
        a[0][0].should.be.an.instanceof(Order);
    });
    it("groupBy.(o => o.toOneRelation.toOneRelation)", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetailProperties.groupBy(o => o.OrderDetail.Order);
        const queryString = groupBy.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderId] nvarchar(255)\n);\nINSERT INTO @temp_entity0\nSELECT [entity1].[OrderId]\nFROM [OrderDetailProperties] AS [entity0]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n) AS entity1\n\tON [entity0].[OrderDetailId] = [entity1].[OrderDetailId]\nGROUP BY [entity1].[OrderId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity2].[OrderId],\n\t[entity2].[TotalAmount],\n\t[entity2].[OrderDate]\nFROM [Orders] AS [entity2]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity2].[OrderId] = [entity3].[OrderId];\n\nSELECT [entity0].[OrderDetailPropertyId],\n\t[entity1].[OrderId],\n\t[entity0].[OrderDetailId],\n\t[entity0].[Name],\n\t[entity0].[Amount]\nFROM [OrderDetailProperties] AS [entity0]\nINNER JOIN (\n\tSELECT [entity1].[OrderDetailId],\n\t\t[entity1].[OrderId],\n\t\t[entity1].[ProductId],\n\t\t[entity1].[ProductName],\n\t\t[entity1].[Quantity],\n\t\t[entity1].[CreatedDate],\n\t\t[entity1].[isDeleted]\n\tFROM [OrderDetails] AS [entity1]\n\tWHERE NOT(\n\t\t([entity1].[isDeleted] = CAST (1 AS BIT))\n\t)\n) AS entity1\n\tON [entity0].[OrderDetailId] = [entity1].[OrderDetailId]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON [entity1].[OrderId] = [entity3].[OrderId];"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("array").with.property("key").which.is.an.instanceof(Order);
        a[0][0].should.be.an.instanceof(OrderDetailProperty);
    });
    it("groupBy.(o => ({col: o.toOneRelation.column.method(), col: o.toOneRelation.column }))", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetails.groupBy(o => ({
            date: o.Order.OrderDate.getDate(),
            price: o.Product.Price
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[column0] decimal,\n\t[Price] bigint\n);\nINSERT INTO @temp_entity0\nSELECT DAY([entity1].[OrderDate]) AS [column0],\n\t[entity2].[Price]\nFROM [OrderDetails] AS [entity0]\nINNER JOIN [Orders] AS [entity1]\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nINNER JOIN [Products] AS [entity2]\n\tON [entity0].[ProductId] = [entity2].[ProductId]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n)\nGROUP BY DAY([entity1].[OrderDate]), [entity2].[Price];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity0].[OrderDetailId],\n\tDAY([entity1].[OrderDate]) AS [column0],\n\t[entity2].[Price],\n\t[entity0].[OrderId],\n\t[entity0].[ProductId],\n\t[entity0].[ProductName],\n\t[entity0].[Quantity],\n\t[entity0].[CreatedDate],\n\t[entity0].[isDeleted]\nFROM [OrderDetails] AS [entity0]\nINNER JOIN [Orders] AS [entity1]\n\tON [entity0].[OrderId] = [entity1].[OrderId]\nINNER JOIN [Products] AS [entity2]\n\tON [entity0].[ProductId] = [entity2].[ProductId]\nINNER JOIN @temp_entity0 AS [entity3]\n\tON DAY([entity1].[OrderDate]) = [entity3].[column0] AND [entity2].[Price] = [entity3].[Price]\nWHERE NOT(\n\t([entity0].[isDeleted] = CAST (1 AS BIT))\n);"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("array").with.property("key").which.has.property("price").which.is.a("number");
        a[0].should.has.property("key").which.has.property("price").which.is.a("number");
        a[0][0].should.be.an.instanceof(OrderDetail);
    });
    it("groupBy.(o => ({col: o.toOneRelation }))", async () => {
        const db = new MyDb();
        const groupBy = db.orderDetailProperties.groupBy(o => ({
            od: o.OrderDetail
        }));
        const queryString = groupBy.toString();

        expect(queryString).to.equal("DECLARE @temp_entity0  TABLE\n(\n\t[OrderDetailId] nvarchar(255)\n);\nINSERT INTO @temp_entity0\nSELECT [entity0].[OrderDetailId]\nFROM [OrderDetailProperties] AS [entity0]\nGROUP BY [entity0].[OrderDetailId];\nSELECT * FROM @temp_entity0;\n\nSELECT [entity1].[OrderDetailId],\n\t[entity1].[OrderId],\n\t[entity1].[ProductId],\n\t[entity1].[ProductName],\n\t[entity1].[Quantity],\n\t[entity1].[CreatedDate],\n\t[entity1].[isDeleted]\nFROM [OrderDetails] AS [entity1]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity1].[OrderDetailId] = [entity2].[OrderDetailId]\nWHERE NOT(\n\t([entity1].[isDeleted] = CAST (1 AS BIT))\n);\n\nSELECT [entity0].[OrderDetailPropertyId],\n\t[entity0].[OrderDetailId],\n\t[entity0].[Name],\n\t[entity0].[Amount]\nFROM [OrderDetailProperties] AS [entity0]\nINNER JOIN @temp_entity0 AS [entity2]\n\tON [entity0].[OrderDetailId] = [entity2].[OrderDetailId];"
            , "query not equals");

        const a = await groupBy.toArray();

        should();
        a.should.be.a("array");
        a[0].should.be.a("array").with.property("key").which.has.property("od").which.is.an.instanceof(OrderDetail);
        a[0][0].should.be.an.instanceof(OrderDetailProperty);
    });
});
describe("PARAMETERS", async () => {
    it("should work", async () => {
        const db = new MyDb();
        const paramObj = { now: (new Date()).addYears(-1) };
        const parameter = db.orders.setParameters({ paramObj }).where(o => o.OrderDate < paramObj.now);

        const queryString = parameter.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[OrderDate] < @param_99212270)"
            , "query not equals");

        const a = await parameter.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
    it("should be computed in application", async () => {
        const db = new MyDb();
        const paramObj = { now: new Date() };
        const parameter = db.orders.setParameters({ paramObj }).where(o => o.OrderDate.getDate() < paramObj.now.getDate());

        const queryString = parameter.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE (DAY([entity0].[OrderDate]) < @param_1917381961)"
            , "query not equals");

        const a = await parameter.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
    it("should be computed in query", async () => {
        const db = new MyDb();
        const parameter = db.orders.where(o => o.OrderDate < new Date());

        const queryString = parameter.toString();

        expect(queryString).to.equal("SELECT [entity0].[OrderId],\n\t[entity0].[TotalAmount],\n\t[entity0].[OrderDate]\nFROM [Orders] AS [entity0]\nWHERE ([entity0].[OrderDate] < @param_694659121)"
            , "query not equals");

        const a = await parameter.toArray();
        should();
        a.should.be.a("array");
        a.should.has.length.greaterThan(0);
        a[0].should.be.instanceof(Order);
    });
});

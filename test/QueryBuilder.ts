import { assert } from "chai";
import "mocha";
import { FunctionExpression, GreaterEqualExpression, MemberAccessExpression, NotExpression, ParameterExpression, ValueExpression, MethodCallExpression, ObjectValueExpression } from "../src/ExpressionBuilder/Expression/index";
import { SelectManyQueryable, SelectQueryable, WhereQueryable, InnerJoinQueryable } from "../src/Linq/Queryable/index";
import { MyDb } from "./Common/MyDb";
import { OrderDetail, Order } from "./Common/Model/index";

describe("Query builder", () => {
    const db = new MyDb({});
    it("dbset.tostring()", () => {
        const result = db.orders.toString();
        assert.equal(result.replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity0].[Total] FROM [Orders] AS [entity0]");
    });
    it("select column expression", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderId"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId] FROM [Orders] AS [entity0]");
    });
    it("select list property", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const a = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param, "Order"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity1].[OrderId], [entity1].[Total] FROM [Orders] AS [entity1]");
    });

    it("select scalar property", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const w = new WhereQueryable(db.orderDetails, new FunctionExpression(new NotExpression(new MemberAccessExpression(param, "isDeleted")), [param]));
        const a = new SelectQueryable(w, new FunctionExpression(new MemberAccessExpression(param, "Order"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderId], [entity2].[Total] FROM [Orders] AS [entity2] INNER JOIN [OrderDetails] AS [entity0] ON [entity2].[OrderId] = [entity0].[OrderId] WHERE ([entity0].[isDeleted]<> 1)");
    });
    it("selectMany", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectManyQueryable(w, new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderDetailId], [entity2].[OrderId], [entity2].[name], [entity2].[isDeleted] FROM [OrderDetails] AS [entity2] INNER JOIN [Orders] AS [entity0] ON [entity2].[OrderId] = [entity0].[OrderId] WHERE ([entity0].[Total] >= (10000))");
    });
    it("select list first or default", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectQueryable(w, new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "first", []), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity3].[OrderDetailId], [entity3].[OrderId], [entity3].[name], [entity3].[isDeleted] FROM [OrderDetails] AS [entity3] WHERE ([entity3].[OrderDetailId] IN (SELECT (MIN([entity2].[OrderDetailId])) AS [column0] FROM [OrderDetails] AS [entity2] INNER JOIN [Orders] AS [entity0] ON [entity2].[OrderId] = [entity0].[OrderId] GROUP BY [entity2].[OrderId]))");
    });
    it("join", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new InnerJoinQueryable(w, db.orderDetails, new FunctionExpression(new MemberAccessExpression(param, "OrderId"), [param]), new FunctionExpression(new MemberAccessExpression(param2, "OrderId"), [param2]),
            new FunctionExpression<Order | OrderDetail, any>(new ObjectValueExpression({
                OD: new MemberAccessExpression(param2, "name"),
                Order: new MemberAccessExpression(param, "Total")
            }), [param, param2]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity4].[OD], [entity4].[Order] FROM ( SELECT [entity2].[name] AS [OD], [entity3].[Total] AS [Order] FROM [Orders] AS [entity0] INNER JOIN [OrderDetails] AS [entity2] ON [entity0].[OrderId] = [entity2].[OrderId] WHERE ([entity0].[Total] >= (10000)) ) AS [entity4]");
    });
});

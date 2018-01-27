import { assert } from "chai";
import "mocha";
import { FunctionExpression, GreaterEqualExpression, MemberAccessExpression, NotExpression, ParameterExpression, ValueExpression, MethodCallExpression, ObjectValueExpression, GreaterThanExpression } from "../src/ExpressionBuilder/Expression/index";
import { SelectManyQueryable, SelectQueryable, WhereQueryable, InnerJoinQueryable, UnionQueryable, IntersectQueryable, ExceptQueryable } from "../src/Linq/Queryable/index";
import { MyDb } from "./Common/MyDb";
import { OrderDetail, Order } from "./Common/Model/index";

describe("Query builder", () => {
    const db = new MyDb({});
    it("dbset.tostring()", () => {
        const result = db.orders.toString();
        assert.equal(result.replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity0].[Total], [entity0].[OrderDate] FROM [Orders] AS [entity0]");
    });
    it("order.select(o => o.OrderId)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderId"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId] FROM [Orders] AS [entity0]");
    });
    it("orderDetails.select(o => o.Order)", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const a = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param, "Order"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity1].[OrderId], [entity1].[Total], [entity1].[OrderDate] FROM [Orders] AS [entity1]");
    });

    it("orderDetails.where(o => !o.isDeleted).select(o => o.Order)", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const w = new WhereQueryable(db.orderDetails, new FunctionExpression(new NotExpression(new MemberAccessExpression(param, "isDeleted")), [param]));
        const a = new SelectQueryable(w, new FunctionExpression(new MemberAccessExpression(param, "Order"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity1].[OrderId], [entity1].[Total], [entity1].[OrderDate] FROM [Orders] AS [entity1] INNER JOIN [OrderDetails] AS [entity0] ON [entity1].[OrderId] = [entity0].[OrderId] WHERE ([entity0].[isDeleted]<> 1)");
    });
    it("orders.where(o => o.Total > 10000).selectMany(o => o.OrderDetails)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectManyQueryable(w, new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [OrderDetails] AS [entity1] INNER JOIN [Orders] AS [entity0] ON [entity1].[OrderId] = [entity0].[OrderId] WHERE ([entity0].[Total] >= (10000))");
    });
    it("order.where(o => o.Total > 10000).select(o => o.OrderDetails.first())", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectQueryable(w, new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "first", []), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderDetailId], [entity2].[OrderId], [entity2].[name], [entity2].[CreatedDate], [entity2].[isDeleted] FROM [OrderDetails] AS [entity2] WHERE ([entity2].[OrderDetailId] IN (SELECT (MIN([entity1].[OrderDetailId])) AS [column0] FROM [OrderDetails] AS [entity1] INNER JOIN [Orders] AS [entity0] ON [entity1].[OrderId] = [entity0].[OrderId] GROUP BY [entity1].[OrderId]))");
    });
    it("orders.where(o => o.Total > 10000).innerJoin(orderDetails, o => o.OrderId, od => od.OrderId, (o, od) => ({ OD: od.name, Order: o.Total }))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new InnerJoinQueryable(w, db.orderDetails, new FunctionExpression(new MemberAccessExpression(param, "OrderId"), [param]), new FunctionExpression(new MemberAccessExpression(param2, "OrderId"), [param2]),
            new FunctionExpression<Order | OrderDetail, any>(new ObjectValueExpression({
                OD: new MemberAccessExpression(param2, "name"),
                Order: new MemberAccessExpression(param, "Total")
            }), [param, param2]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OD], [entity2].[Order] FROM ( SELECT [entity1].[name] AS [OD], [entity0].[Total] AS [Order] FROM [Orders] AS [entity0] INNER JOIN [OrderDetails] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity0].[Total] >= (10000)) ) AS [entity2]");
    });
    it("orders.select(o => o.OrderDate).union(orderDetails.select(o => o.CreatedDate))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]));
        const b = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]));
        const c = new UnionQueryable(a, b, true);
        assert.equal(c.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderDate] FROM ( ( SELECT [entity0].[OrderDate] FROM [Orders] AS [entity0] ) UNION ALL ( SELECT [entity1].[CreatedDate] FROM [OrderDetails] AS [entity1] ) ) AS [entity2]");
    });
    it("orders.where(o => o.Total > 10000).select(o => o.OrderDate).intersect(orderDetails.where(o => o.CreatedDate >= new Date(2018, 0, 1)).select(o => o.CreatedDate)).where(o => o >= new Date(2018, 0, 1))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const a = new SelectQueryable(new WhereQueryable(db.orders, new FunctionExpression(new GreaterThanExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param])), new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]));
        const b = new SelectQueryable(new WhereQueryable(db.orderDetails, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param2, "CreatedDate"), new ValueExpression(new Date(2018, 0, 1))), [param2])), new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]));
        const c = new IntersectQueryable(a, b);
        const param3 = new ParameterExpression("u", c.type);
        const d = new WhereQueryable(c, new FunctionExpression(new GreaterEqualExpression(param3, new ValueExpression(new Date(2018, 0, 1))), [param3]));
        assert.equal(d.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderDate] FROM ( ( SELECT [entity0].[OrderDate] FROM [Orders] AS [entity0] WHERE ([entity0].[Total] > (10000)) ) INTERSECT ( SELECT [entity1].[CreatedDate] FROM [OrderDetails] AS [entity1] WHERE ([entity1].[CreatedDate] >= ('2018-01-01 00:00:00')) ) ) AS [entity2] WHERE ([entity2].[OrderDate] >= ('2018-01-01 00:00:00'))");
    });
    it("orders.select(o => o.OrderDate).except(orderDetails.select(o => o.CreatedDate))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]));
        const b = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]));
        const c = new ExceptQueryable(a, b);
        assert.equal(c.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderDate] FROM ( ( SELECT [entity0].[OrderDate] FROM [Orders] AS [entity0] ) EXCEPT ( SELECT [entity1].[CreatedDate] FROM [OrderDetails] AS [entity1] ) ) AS [entity2]");
    });
});

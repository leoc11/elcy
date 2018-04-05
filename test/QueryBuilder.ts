import { assert } from "chai";
import "mocha";
import { FunctionExpression, GreaterEqualExpression, GreaterThanExpression, LessThanExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ObjectValueExpression, OrExpression, ParameterExpression, StrictNotEqualExpression, ValueExpression, AndExpression, EqualExpression, NotEqualExpression } from "../src/ExpressionBuilder/Expression/index";
import { Enumerable } from "../src/Linq/Enumerable/index";
import { ExceptQueryable, GroupByQueryable, InnerJoinQueryable, IntersectQueryable, PivotQueryable, SelectManyQueryable, SelectQueryable, UnionQueryable, WhereQueryable } from "../src/Linq/Queryable/index";
import { GroupedExpression } from "../src/Linq/Queryable/QueryExpression/GroupedExpression";
import { SelectExpression } from "../src/Linq/Queryable/QueryExpression/index";
import { Order, OrderDetail } from "./Common/Model/index";
import { MyDb } from "./Common/MyDb";
import { IncludeQueryable } from "../src/Linq/Queryable/IncludeQueryable";

const db = new MyDb({});
describe("Query builder", () => {
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
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity1].[OrderId], [entity1].[Total], [entity1].[OrderDate] FROM [Orders] AS [entity1] INNER JOIN [OrderDetails] AS [entity0] ON [entity1].[OrderId] = [entity0].[OrderId] WHERE [entity0].[isDeleted] <> 1");
    });
    it("orders.where(o => o.Total > 10000).selectMany(o => o.OrderDetails)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectManyQueryable(w, new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [OrderDetails] AS [entity1] INNER JOIN [Orders] AS [entity0] ON [entity1].[OrderId] = [entity0].[OrderId] WHERE ([entity0].[Total] >= 10000)");
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
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity1].[name] AS [OD], [entity0].[Total] AS [Order] FROM [Orders] AS [entity0] INNER JOIN [OrderDetails] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity0].[Total] >= 10000)");
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
        assert.equal(d.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderDate] FROM ( ( SELECT [entity0].[OrderDate] FROM [Orders] AS [entity0] WHERE ([entity0].[Total] > 10000) ) INTERSECT ( SELECT [entity1].[CreatedDate] FROM [OrderDetails] AS [entity1] WHERE ([entity1].[CreatedDate] >= '2018-01-01 00:00:00') ) ) AS [entity2] WHERE ([entity2].[OrderDate] >= '2018-01-01 00:00:00')");
    });
    it("orders.select(o => o.OrderDate).except(orderDetails.select(o => o.CreatedDate))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]));
        const b = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]));
        const c = new ExceptQueryable(a, b);
        assert.equal(c.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[OrderDate] FROM ( ( SELECT [entity0].[OrderDate] FROM [Orders] AS [entity0] ) EXCEPT ( SELECT [entity1].[CreatedDate] FROM [OrderDetails] AS [entity1] ) ) AS [entity2]");
    });
    it("orderDetails.pivot({date: o => o.Order.OrderDate}, {count: o => o.count(), avg: o => o.avg(p => p.Order.Total), max: o => o.max(p => p.Order.Total), min: o => o.min(p => p.Order.Total), sum: o => o.sum(p => p.Order.Total)})", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const param1 = new ParameterExpression("o", Enumerable);
        // const param2 = new ParameterExpression("od", db.orderDetails.type);
        const a = new ObjectValueExpression({
            date: new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "OrderDate"), [param])
        });
        const b = new ObjectValueExpression({
            avg: new FunctionExpression(new MethodCallExpression(param1, "avg", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]), [param1]),
            count: new FunctionExpression(new MethodCallExpression(param1, "count", []), [param1]),
            max: new FunctionExpression(new MethodCallExpression(param1, "max", [new FunctionExpression(new MemberAccessExpression(param, "OrderDetailId"), [param])]), [param1]),
            min: new FunctionExpression(new MethodCallExpression(param1, "min", [new FunctionExpression(new MemberAccessExpression(param, "OrderDetailId"), [param])]), [param1]),
            totalSum: new FunctionExpression(new MethodCallExpression(param1, "sum", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]), [param1])
        });
        const c = new PivotQueryable(db.orderDetails, a, b);
        assert.equal(c.toString().replace(/[\n\t]+/g, " "), "SELECT [entity4].[date], [entity4].[avg], [entity4].[count], [entity4].[max], [entity4].[min], [entity4].[totalSum] FROM ( SELECT [entity1].[OrderDate] AS [date], AVG([entity1].[Total]) AS [avg], COUNT(*) AS [count], MAX([entity0].[OrderDetailId]) AS [max], MIN([entity0].[OrderDetailId]) AS [min], SUM([entity1].[Total]) AS [totalSum] FROM [OrderDetails] AS [entity0] INNER JOIN [Orders] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] GROUP BY [entity1].[date] ) AS [entity4]");
    });
    it("orders.select(o => o.Total).max()", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "Total"), [param]));
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "max", []);
        const param2 = { parent: expression, type: "max" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT MAX([entity0].[Total]) AS [column0] FROM [Orders] AS [entity0]");
    });
    it("orders.min(o => o.Total)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = db.orders;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "min", [new FunctionExpression(new MemberAccessExpression(param, "Total"), [param])]);
        const param2 = { parent: expression, type: "min" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT MIN([entity0].[Total]) AS [column0] FROM [Orders] AS [entity0]");
    });
    it("orderDetails.avg(o => o.Order.Total)", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const a = db.orderDetails;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "avg", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]);
        const param2 = { parent: expression, type: "avg" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT AVG([entity1].[Total]) AS [column0] FROM [Orders] AS [entity1]");
    });
    it("orders.selectMany(o => o.OrderDetails).count()", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new SelectManyQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param]));
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "count", []);
        const param2 = { parent: expression, type: "count" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT COUNT(*) AS [column0] FROM [OrderDetails] AS [entity1]");
    });
    it("orders.sum(o => o.Total)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = db.orders;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "sum", [new FunctionExpression(new MemberAccessExpression(param, "Total"), [param])]);
        const param2 = { parent: expression, type: "sum" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT SUM([entity0].[Total]) AS [column0] FROM [Orders] AS [entity0]");
    });
});

describe("Query builder: where", () => {
    it("orders.where(o => o.Total > 1000 || o.OrderDate >= new Date(2018, 0, 1))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new GreaterThanExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(1000));
        const b = new GreaterEqualExpression(new MemberAccessExpression(param, "OrderDate"), new ValueExpression(new Date(2018, 0, 1)));
        const c = new OrExpression(a, b);
        const d = new WhereQueryable(db.orders, new FunctionExpression(c, [param]));
        assert.equal(d.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity0].[Total], [entity0].[OrderDate] FROM [Orders] AS [entity0] WHERE (([entity0].[Total] > 1000) OR ([entity0].[OrderDate] >= '2018-01-01 00:00:00'))");
    });
    it("orderDetails.where(o => o.Order.Total > 1000).where(o => o.CreatedDate > o.Order.OrderDate)", () => {
        const param = new ParameterExpression("od", db.orderDetails.type);
        const a = new GreaterThanExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), new ValueExpression(1000));
        const b = new GreaterEqualExpression(new MemberAccessExpression(param, "CreatedDate"), new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "OrderDate"));
        const c = new WhereQueryable(db.orderDetails, new FunctionExpression(a, [param]));
        const d = new WhereQueryable(c, new FunctionExpression(b, [param]));
        assert.equal(d.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderDetailId], [entity0].[OrderId], [entity0].[name], [entity0].[CreatedDate], [entity0].[isDeleted] FROM [OrderDetails] AS [entity0] INNER JOIN [Orders] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE (([entity1].[Total] > 1000) AND ([entity0].[CreatedDate] >= [entity1].[OrderDate]))");
    });
    it("order.where(o => o.OrderDetails.count() > 2)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new GreaterThanExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "count", []), new ValueExpression(2));
        const b = new WhereQueryable(db.orders, new FunctionExpression(a, [param]));
        assert.equal(b.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity0].[Total], [entity0].[OrderDate] FROM [Orders] AS [entity0] LEFT JOIN ( SELECT [entity1].[OrderId], COUNT(*) AS [column0] FROM [OrderDetails] AS [entity1] GROUP BY [entity1].[OrderId] ) AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity1].[column0] > 2)");
    });
    it("order.where(o => o.OrderDetails.count() > 2).where(o => o.OrderDetails.max(p => p.CreatedDate) < new Date(2018, 0, 1))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("p", OrderDetail);
        const a = new GreaterThanExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "count", []), new ValueExpression(2));
        const b = new WhereQueryable(db.orders, new FunctionExpression(a, [param]));
        const c1 = new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]);
        const c = new LessThanExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "max", [c1]), new ValueExpression(new Date(2018, 0, 1)));
        const d = new WhereQueryable(b, new FunctionExpression(c, [param]));
        assert.equal(d.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity0].[Total], [entity0].[OrderDate] FROM [Orders] AS [entity0] LEFT JOIN ( SELECT [entity1].[OrderId], COUNT(*) AS [column0] FROM [OrderDetails] AS [entity1] GROUP BY [entity1].[OrderId] ) AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] LEFT JOIN ( SELECT MAX([entity2].[CreatedDate]) AS [column1] FROM [OrderDetails] AS [entity2] ) AS [entity2] ON [entity0].[OrderId] = [entity2].[OrderId] WHERE (([entity1].[column0] > 2) AND ([entity2].[column1] < '2018-01-01 00:00:00'))");
    });
});
describe("Query builder: group", () => {
    it("orderDetails.groupBy(o => o.Order.OrderDate).select(o => new { date: o.key, count: o.count(), avg: o.avg(p => p.Order.Total), max: o.max(p => p.Order.Total), min: o.min(p => p.Order.Total), sum: o.sum(p => p.Order.Total) })", () => {
        const a = db.orderDetails;
        const param = new ParameterExpression("o", db.orderDetails.type);
        const b = new GroupByQueryable(a, new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "OrderDate"), [param]));
        const param1 = new ParameterExpression("o", GroupedExpression as any);
        const c = new SelectQueryable(b, new FunctionExpression(new ObjectValueExpression({
            date: new MemberAccessExpression(param1, "key"),
            count: new MethodCallExpression(param1, "count", []),
            avg: new MethodCallExpression(param1, "avg", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]),
            max: new MethodCallExpression(param1, "max", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]),
            min: new MethodCallExpression(param1, "min", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]),
            sum: new MethodCallExpression(param1, "sum", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])])
        }), [param1]));
        assert.equal(c.toString().replace(/[\n\t]+/g, " "), "SELECT [entity6].[date], [entity6].[count], [entity6].[avg], [entity6].[max], [entity6].[min], [entity6].[sum] FROM ( SELECT [entity1].[OrderDate] AS [date], COUNT(*) AS [count], AVG([entity1].[Total]) AS [avg], MAX([entity1].[Total]) AS [max], MIN([entity1].[Total]) AS [min], SUM([entity1].[Total]) AS [sum] FROM [OrderDetails] AS [entity0] INNER JOIN [Orders] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] GROUP BY [entity1].[OrderDate] ) AS [entity6]");
    });
    it("orderDetails.groupBy(o => o.Order.OrderDate).where(o => o.Key > new Date(2018,0,1) && o.count() > 1).select(o => new { date: o.key, count: o.count() })", () => {
        const a = db.orderDetails;
        const param = new ParameterExpression("o", db.orderDetails.type);
        const b = new GroupByQueryable(a, new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "OrderDate"), [param]));
        const param1 = new ParameterExpression("o", GroupedExpression as any);
        const c1 = new GreaterThanExpression(new MemberAccessExpression(param1, "key"), new ValueExpression(new Date(2018, 0, 1)));
        const c2 = new GreaterThanExpression(new MethodCallExpression(param1, "count", []), new ValueExpression(1));
        const c = new WhereQueryable(b, new FunctionExpression(new AndExpression(c1, c2), [param1]));
        const d = new SelectQueryable(c, new FunctionExpression(new ObjectValueExpression({
            date: new MemberAccessExpression(param1, "key"),
            count: new MethodCallExpression(param1, "count", []),
        }), [param1]));
        assert.equal(d.toString().replace(/[\n\t]+/g, " "), "SELECT [entity2].[date], [entity2].[count] FROM ( SELECT [entity1].[OrderDate] AS [date], COUNT(*) AS [count] FROM [OrderDetails] AS [entity0] INNER JOIN [Orders] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] GROUP BY [entity1].[OrderDate] HAVING (([entity1].[OrderDate] > '2018-01-01 00:00:00') AND (COUNT(*) > 1)) ) AS [entity2]");
    });
    it("orderDetails.groupBy(o => o.Order.OrderDate).where(o => (o.Key > new Date(2018,0,1) && o.count() > 1) || (o.sum(p => p.Order.Total) > 10000 && o.any(p => p.name.endsWith('a')) === false)).select(o => new { date: o.key, count: o.count() })", () => {
        const a = db.orderDetails;
        const param = new ParameterExpression("o", db.orderDetails.type);
        const b = new GroupByQueryable(a, new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "OrderDate"), [param]));
        const param1 = new ParameterExpression("c", GroupedExpression as any);
        const c1 = new GreaterThanExpression(new MemberAccessExpression(param1, "key"), new ValueExpression(new Date(2018, 0, 1)));
        const c2 = new GreaterThanExpression(new MethodCallExpression(param1, "count", []), new ValueExpression(1));
        const c3 = new GreaterThanExpression(new MethodCallExpression(param1, "sum", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]), new ValueExpression(10000));
        const c4 = new EqualExpression(new MethodCallExpression(param1, "any", [new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param, "name"), "endsWith", [new ValueExpression("a")]), [param])]), new ValueExpression(false));
        const c = new WhereQueryable(b, new FunctionExpression(new OrExpression(new AndExpression(c1, c2), new AndExpression(c3, c4)), [param1]));
        const d = new SelectQueryable(c, new FunctionExpression(new ObjectValueExpression({
            date: new MemberAccessExpression(param1, "key"),
            count: new MethodCallExpression(param1, "count", []),
        }), [param1]));
        assert.equal(d.toString().replace(/[\n\t]+/g, " "), "SELECT [entity6].[date], [entity6].[count], [entity6].[avg], [entity6].[max], [entity6].[min], [entity6].[sum] FROM ( SELECT [entity1].[OrderDate] AS [date], COUNT(*) AS [count], AVG([entity1].[Total]) AS [avg], MAX([entity1].[Total]) AS [max], MIN([entity1].[Total]) AS [min], SUM([entity1].[Total]) AS [sum] FROM [OrderDetails] AS [entity0] INNER JOIN [Orders] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] GROUP BY [entity1].[OrderDate] ) AS [entity6]");
    });
});
describe("Query builder: any", () => {
    it("orders.any()", () => {
        const a = db.orders;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "any", []);
        const param2 = { parent: expression, type: "any" };
        expression = queryBuilder.visit(methodExpression, param2) as any;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "EXIST( SELECT CAST (1 AS BIT) AS [column0] FROM [Orders] AS [entity1] )");
    });
    it("orderDetails.any(o => o.Order !== null)", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const a = db.orderDetails;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "any", [new FunctionExpression(new StrictNotEqualExpression(new MemberAccessExpression(param, "Order"), new ValueExpression(null)), [param])]);
        const param2 = { parent: expression, type: "any" };
        expression = queryBuilder.visit(methodExpression, param2) as any;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "EXIST( SELECT CAST (1 AS BIT) AS [column0] FROM [OrderDetails] AS [entity1] INNER JOIN [Orders] AS [entity2] ON [entity1].[OrderId] = [entity2].[OrderId] WHERE ([entity2].[OrderId] <> NULL) )");
    });
    it("orders.any(o => o.OrderDetails.count() > 0)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = db.orders;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "any", [new FunctionExpression(new GreaterThanExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "count", []), new ValueExpression(0)), [param])]);
        const param2 = { parent: expression, type: "any" };
        expression = queryBuilder.visit(methodExpression, param2) as any;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "EXIST( SELECT CAST (1 AS BIT) AS [column1] FROM [Orders] AS [entity1] LEFT JOIN ( SELECT [entity2].[OrderId], COUNT(*) AS [column0] FROM [OrderDetails] AS [entity2] GROUP BY [entity2].[OrderId] ) AS [entity2] ON [entity1].[OrderId] = [entity2].[OrderId] WHERE ([entity2].[column0] > 0) )");
    });
    it("orders.any(o => ({ odcount: o.OrderDetails.count()}))", () => {
        //  assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
    it("orders.selectMany(o => o.OrderDetails).any()", () => {
        // assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
    it("order.where(o => o.Total > 10000).select(o => o.OrderDetails.any())", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectQueryable(w, new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "any", []), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [Orders] AS [entity0] LEFT JOIN ( SELECT [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [OrderDetails] AS [entity1] WHERE [entity1].[OrderDetailId] IN (SELECT [entity2].[OrderDetailId] AS [column0] FROM [OrderDetails] AS [entity2] GROUP BY [entity0].[OrderId]) ) AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity0].[Total] >= 10000)");
    });
    it("orders.select(o => {od: o.OrderDetails.first()}).any()", () => {
        // assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
});

describe("Query builder: all", () => {
    it("order.where(o => o.Total > 10000).select(o => o.OrderDetails.where(p => p.OrderId != null).all(od => od.name.like('%a%'))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectQueryable(w, new FunctionExpression(new MethodCallExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "where", [new FunctionExpression(new NotEqualExpression(new MemberAccessExpression(param2, "OrderId"), new ValueExpression(null)), [param2])]), "all", [new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param2, "name"), "like", [new ValueExpression("%a%")]), [param2])]), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [Orders] AS [entity0] LEFT JOIN ( SELECT [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [OrderDetails] AS [entity1] WHERE [entity1].[OrderDetailId] IN (SELECT [entity2].[OrderDetailId] AS [column0] FROM [OrderDetails] AS [entity2] GROUP BY [entity0].[OrderId]) ) AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity0].[Total] >= 10000)");
    });
});
describe("Query builder: include", () => {
    it("order.include(o => o.OrderDetails)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param])]);
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity0].[Total], [entity0].[OrderDate], [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [Orders] AS [entity0] LEFT JOIN [OrderDetails] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId]");
    });
    it("orders.include(o => o.Total)", () => {
        // assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
    it("orders.include(o => o.OrderDetails.include(od => od.name))", () => {
        // assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
});
describe("Query builder: first", () => {
    it("orders.first()", () => {
        const a = db.orders;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "first", []);
        const param2 = { parent: expression, type: "first" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT TOP 1 [entity0].[OrderId], [entity0].[Total], [entity0].[OrderDate] FROM [Orders] AS [entity0]");
    });
    it("orderDetails.first(o => o.Order !== null)", () => {
        const param = new ParameterExpression("o", db.orderDetails.type);
        const a = db.orderDetails;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "first", [new FunctionExpression(new StrictNotEqualExpression(new MemberAccessExpression(param, "Order"), new ValueExpression(null)), [param])]);
        const param2 = { parent: expression, type: "first" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT TOP 1 [entity0].[OrderDetailId], [entity0].[OrderId], [entity0].[name], [entity0].[CreatedDate], [entity0].[isDeleted] FROM [OrderDetails] AS [entity0] INNER JOIN [Orders] AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity1].[OrderId] <> NULL)");
    });
    it("orders.first(o => o.OrderDetails.count() > 0)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = db.orders;
        const queryBuilder = a.queryBuilder;
        let expression = a.buildQuery(queryBuilder) as SelectExpression;
        const methodExpression = new MethodCallExpression(expression, "first", [new FunctionExpression(new GreaterThanExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "count", []), new ValueExpression(0)), [param])]);
        const param2 = { parent: expression, type: "first" };
        queryBuilder.visit(methodExpression, param2);
        expression = param2.parent;
        assert.equal(expression.toString(queryBuilder).replace(/[\n\t]+/g, " "), "SELECT TOP 1 [entity0].[OrderId], [entity0].[Total], [entity0].[OrderDate] FROM [Orders] AS [entity0] LEFT JOIN ( SELECT [entity1].[OrderId], COUNT(*) AS [column0] FROM [OrderDetails] AS [entity1] GROUP BY [entity1].[OrderId] ) AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity1].[column0] > 0)");
    });
    it("orders.first(o => ({ odcount: o.OrderDetails.count()}))", () => {
        //  assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
    it("orders.selectMany(o => o.OrderDetails).first()", () => {
        // assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
    it("order.where(o => o.Total > 10000).select(o => o.OrderDetails.first())", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
        const a = new SelectQueryable(w, new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "first", []), [param]));
        assert.equal(a.toString().replace(/[\n\t]+/g, " "), "SELECT [entity0].[OrderId], [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [Orders] AS [entity0] LEFT JOIN ( SELECT [entity1].[OrderDetailId], [entity1].[OrderId], [entity1].[name], [entity1].[CreatedDate], [entity1].[isDeleted] FROM [OrderDetails] AS [entity1] WHERE [entity1].[OrderDetailId] IN (SELECT [entity2].[OrderDetailId] AS [column0] FROM [OrderDetails] AS [entity2] GROUP BY [entity0].[OrderId]) ) AS [entity1] ON [entity0].[OrderId] = [entity1].[OrderId] WHERE ([entity0].[Total] >= 10000)");
    });
    it("orders.select(o => {od: o.OrderDetails.first()}).first()", () => {
        // assert.equal(expression.toString(a.queryBuilder).replace(/[\n\t]+/g, " "), "SELECT (SUM([entity0].[Total])) AS [column0] FROM [Orders] AS [entity0]");
    });
});

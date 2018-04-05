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
import { ArrayQueryResultParser } from "../src/QueryBuilder/ResultParser/ArrayQueryResultParser";

describe("Transformer", () => {
    it("order.Include(o => o.OrderDetails)", () => {
        const db = new MyDb({});
        const param = new ParameterExpression("o", db.orders.type);
        const a = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param])]);
        const dummyDatas = [
            ["orderid1", "10000", "2018-01-01 00:00:00", "orderdetailid1", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid1", "10000", "2018-01-01 00:00:00", "orderdetailid2", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid2", "10000", "2018-01-01 00:00:00", "orderdetailid3", "orderid2", "product1", "2018-01-01 00:00:00", "0"]
        ];
        const c = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db, c.entity);
        const res = parser.parse(dummyDatas);
        const util = require("util");
        const result = util.inspect(res, false, null).replace(/\s+/g, " ");
        assert.equal(result, `[ Order { OrderId: 'orderid1', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z, OrderDetails: [ OrderDetail { OrderDetailId: 'orderdetailid1', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: [Circular] }, OrderDetail { OrderDetailId: 'orderdetailid2', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: [Circular] } ] }, Order { OrderId: 'orderid2', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z, OrderDetails: [ OrderDetail { OrderDetailId: 'orderdetailid3', OrderId: 'orderid2', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: [Circular] } ] } ]`);
    });
    it("order.Select(o => o.OrderDetails)", () => {
        const db = new MyDb({});
        const param = new ParameterExpression("o", db.orders.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param]));
        const dummyDatas = [
            ["orderid1", "orderdetailid1", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid1", "orderdetailid2", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid2", "orderdetailid3", "orderid2", "product1", "2018-01-01 00:00:00", "0"]
        ];
        const c = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db, c.entity);
        const res = parser.parse(dummyDatas);
        const util = require("util");
        const result = util.inspect(res, false, null).replace(/\s+/g, " ");
        assert.equal(result, `[ [ OrderDetail { OrderDetailId: 'orderdetailid1', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false }, OrderDetail { OrderDetailId: 'orderdetailid2', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false } ], [ OrderDetail { OrderDetailId: 'orderdetailid3', OrderId: 'orderid2', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false } ] ]`);
    });
    it("orderDetails.Include(o => o.Order)", () => {
        const db = new MyDb({});
        const odparam = new ParameterExpression("o", db.orderDetails.type);
        const a = new IncludeQueryable(db.orderDetails, [new FunctionExpression(new MemberAccessExpression(odparam, "Order"), [odparam])]);
        const dummyDatas = [
            ["orderdetailid1", "orderid1", "product1", "2018-01-01 00:00:00", "0", "orderid1", "10000", "2018-01-01 00:00:00"],
            ["orderdetailid2", "orderid1", "product1", "2018-01-01 00:00:00", "0", "orderid1", "10000", "2018-01-01 00:00:00"],
            ["orderdetailid3", "orderid2", "product1", "2018-01-01 00:00:00", "0", "orderid2", "10000", "2018-01-01 00:00:00"]
        ];
        const c = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db, c.entity);
        const res = parser.parse(dummyDatas);
        const util = require("util");
        let result = util.inspect(res, false, null);
        result = result.replace(/\s+/g, " ");
        assert.equal(result, `[ OrderDetail { OrderDetailId: 'orderdetailid1', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: Order { OrderId: 'orderid1', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z, OrderDetails: [ [Circular], OrderDetail { OrderDetailId: 'orderdetailid2', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: [Circular] } ] } }, OrderDetail { OrderDetailId: 'orderdetailid2', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: Order { OrderId: 'orderid1', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z, OrderDetails: [ OrderDetail { OrderDetailId: 'orderdetailid1', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: [Circular] }, [Circular] ] } }, OrderDetail { OrderDetailId: 'orderdetailid3', OrderId: 'orderid2', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false, Order: Order { OrderId: 'orderid2', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z, OrderDetails: [ [Circular] ] } } ]`);
    });
    it("orders.select(o => o.OrderDate).Except(orderDetails.select(o => o.CreatedDate))", () => {
        const db = new MyDb({});
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]));
        const b = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]));
        const b2 = new ExceptQueryable(a, b);
        const c = b2.buildQuery(b2.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db, c.entity);
        const dummyDatas = [
            ["2018-01-01 00:00:00"],
            ["2018-01-01 00:00:00"],
            ["2018-01-02 00:00:00"],
            ["2018-01-03 00:00:00"],
            ["2018-01-04 00:00:00"],
        ];
        const res = parser.parse(dummyDatas);
        const util = require("util");
        let result = util.inspect(res, false, null);
        result = result.replace(/\s+/g, " ");
        assert.equal(result, `[ 2017-12-31T17:00:00.000Z, 2017-12-31T17:00:00.000Z, 2018-01-01T17:00:00.000Z, 2018-01-02T17:00:00.000Z, 2018-01-03T17:00:00.000Z ]`);
    });
    it("orders.select(o => ({oDate: o.OrderDate, t: o.OrderDetails}))", () => {
        const db = new MyDb({});
        const param = new ParameterExpression("o", db.orders.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new ObjectValueExpression({ oDate: new MemberAccessExpression(param, "OrderDate"), t: new MemberAccessExpression(param, "OrderDetails") }), [param]));
        const dummyDatas = [
            ["orderid1", "2018-01-01 00:00:00", "orderdetailid1", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid1", "2018-01-01 00:00:00", "orderdetailid2", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid2", "2018-01-01 00:00:00", "orderdetailid3", "orderid2", "product1", "2018-01-01 00:00:00", "0"]
        ];
        const c = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db, c.entity);
        const res = parser.parse(dummyDatas);
        const util = require("util");
        let result = util.inspect(res, false, null);
        result = result.replace(/\s+/g, " ");
        assert.equal(result, `[ { oDate: 2017-12-31T17:00:00.000Z, t: [ OrderDetail { OrderDetailId: 'orderdetailid1', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false }, OrderDetail { OrderDetailId: 'orderdetailid2', OrderId: 'orderid1', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false } ] }, { oDate: 2017-12-31T17:00:00.000Z, t: [ OrderDetail { OrderDetailId: 'orderdetailid3', OrderId: 'orderid2', name: 'product1', CreatedDate: 2017-12-31T17:00:00.000Z, isDeleted: false } ] } ]`);
    });
    it("orderDetails.select(o => ({O: o.Order, O1: o.Order}))", () => {
        const db = new MyDb({});
        const param = new ParameterExpression("o", db.orderDetails.type);
        const a = new SelectQueryable(db.orderDetails, new FunctionExpression(new ObjectValueExpression({
            O: new MemberAccessExpression(param, "Order"),
            O1: new MemberAccessExpression(param, "Order")
        }), [param]));
        const dummyDatas = [
            ["orderid1", "10000", "2018-01-01 00:00:00", "orderid1", "10000", "2018-01-01 00:00:00"],
            ["orderid2", "10000", "2018-01-01 00:00:00", "orderid2", "10000", "2018-01-01 00:00:00"],
        ];
        const c = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db, c.entity);
        const res = parser.parse(dummyDatas);
        const util = require("util");
        let result = util.inspect(res, false, null);
        result = result.replace(/\s+/g, " ");
        assert.equal(result, `[ { O: Order { OrderId: 'orderid1', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z }, O1: Order { OrderId: 'orderid1', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z } }, { O: Order { OrderId: 'orderid2', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z }, O1: Order { OrderId: 'orderid2', Total: 10000, OrderDate: 2017-12-31T17:00:00.000Z } } ]`);
    });
});

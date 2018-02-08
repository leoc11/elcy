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

const db = new MyDb({});
describe("Transformer", () => {
    it("order.Include(o => o.OrderDetails)", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param])]);

        const col = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(col.columns, db);
        const dummyDatas = [
            ["orderid1", "10000", "2018-01-01 00:00:00", "orderdetailid1", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid1", "10000", "2018-01-01 00:00:00", "orderdetailid2", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid2", "10000", "2018-01-01 00:00:00", "orderdetailid3", "orderid2", "product1", "2018-01-01 00:00:00", "0"]
        ];
        const res = parser.parse(dummyDatas);
        const result = JSON.stringify(res);
        assert.equal(result, `["2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z"]`);
    });
    it("orderDetails.Include(o => o.Order)", () => {
        const odparam = new ParameterExpression("o", db.orderDetails.type);
        const a = new IncludeQueryable(db.orderDetails, [new FunctionExpression(new MemberAccessExpression(odparam, "Order"), [odparam])]);
        const dummyDatas = [
            ["orderdetailid1", "orderid1", "product1", "2018-01-01 00:00:00", "0", "orderid1", "10000", "2018-01-01 00:00:00"],
            ["orderdetailid2", "orderid1", "product1", "2018-01-01 00:00:00", "0", "orderid1", "10000", "2018-01-01 00:00:00"],
            ["orderdetailid3", "orderid2", "product1", "2018-01-01 00:00:00", "0", "orderid2", "10000", "2018-01-01 00:00:00"]
        ];
        console.log(a.toString());
        const c = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db);
        const res = parser.parse(dummyDatas);
        const result = JSON.stringify(res);
        assert.equal(result, `["2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z"]`);
    });
    it("except", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const param2 = new ParameterExpression("od", db.orderDetails.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]));
        const b = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]));
        const c = new ExceptQueryable(a, b);
        const col = c.buildQuery(c.queryBuilder);
        const parser = new ArrayQueryResultParser(col.columns, db);
        const dummyDatas = [
            ["2018-01-01 00:00:00"],
            ["2018-01-02 00:00:00"],
            ["2018-01-03 00:00:00"],
            ["2018-01-04 00:00:00"],
        ];
        const res = parser.parse(dummyDatas);
        const result = JSON.stringify(res);
        assert.equal(result, `["2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z","2018-02-08T15:12:43.989Z"]`);
    });
    it("orders.select(o => ({oDate: o.OrderDate, t: o.OrderDetails}))", () => {
        const param = new ParameterExpression("o", db.orders.type);
        const a = new SelectQueryable(db.orders, new FunctionExpression(new ObjectValueExpression({ oDate: new MemberAccessExpression(param, "OrderDate"), t: new MemberAccessExpression(param, "OrderDetails") }), [param]));
        const dummyDatas = [
            ["orderid1", "2018-01-01 00:00:00", "orderdetailid1", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid1", "2018-01-01 00:00:00", "orderdetailid2", "orderid1", "product1", "2018-01-01 00:00:00", "0"],
            ["orderid2", "2018-01-01 00:00:00", "orderdetailid3", "orderid2", "product1", "2018-01-01 00:00:00", "0"]
        ];
        const c = a.buildQuery(a.queryBuilder);
        const parser = new ArrayQueryResultParser(c.columns, db);
        const res = parser.parse(dummyDatas);
        const result = JSON.stringify(res);
        assert.equal(result, `[{"oDate":"2018-01-01T00:00:00.000Z","t":[{"OrderDetailId":"orderdetailid1","OrderId":"orderid1","name":"product1","CreatedDate":"2018-01-01T00:00:00.000Z","isDeleted":false},{"OrderDetailId":"orderdetailid2","OrderId":"orderid1","name":"product1","CreatedDate":"2018-01-01T00:00:00.000Z","isDeleted":false}]},{"oDate":"2018-01-01T00:00:00.000Z","t":[{"OrderDetailId":"orderdetailid3","OrderId":"orderid2","name":"product1","CreatedDate":"2018-01-01T00:00:00.000Z","isDeleted":false}]}]`);
    });
});

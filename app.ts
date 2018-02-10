"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression, StrictEqualExpression, AndExpression, OrExpression, LessThanExpression, NotEqualExpression } from "./src/ExpressionBuilder/Expression/index";
import { InnerJoinQueryable, SelectManyQueryable, SelectQueryable, WhereQueryable, UnionQueryable, IntersectQueryable, ExceptQueryable, PivotQueryable, GroupByQueryable } from "./src/Linq/Queryable/index";
import { JoinQueryable } from "./src/Linq/Queryable/JoinQueryable";
import { SelectExpression, GroupByExpression } from "./src/Linq/Queryable/QueryExpression/index";
import { MyDb } from "./test/Common/MyDb";
import { Order, OrderDetail } from "./test/Common/Model/index";
import { WhereEnumerable } from "./src/Linq/Enumerable/WhereEnumerable";
import { Enumerable } from "./src/Linq/Enumerable/Enumerable";
import { GroupedExpression } from "./src/Linq/Queryable/QueryExpression/GroupedExpression";
import { Queryable } from "./src/Linq/Queryable/Queryable";
import { IncludeQueryable } from "./src/Linq/Queryable/IncludeQueryable";
import { ArrayQueryResultParser } from "./src/QueryBuilder/ResultParser/ArrayQueryResultParser";

// // import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// // const expressionBuilder = new ExpressionBuilder();
// // const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // // tslint:disable-next-line:no-console
// // console.log(result);

const db = new MyDb({});
const param = new ParameterExpression("o", db.orderDetails.type);
const a = new SelectQueryable(db.orderDetails, new FunctionExpression(new ObjectValueExpression({
    O: new MemberAccessExpression(param, "Order"),
    O1: new MemberAccessExpression(param, "Order")
}), [param]));
const dummyDatas = [
    ["orderid1", "10000", "2018-01-01 00:00:00", "orderid1", "10000", "2018-01-01 00:00:00"],
    ["orderid1", "10000", "2018-01-01 00:00:00", "orderid1", "10000", "2018-01-01 00:00:00"],
    ["orderid2", "10000", "2018-01-01 00:00:00", "orderid2", "10000", "2018-01-01 00:00:00"],
    ["orderid1", "10000", "2018-01-01 00:00:00", "orderid1", "10000", "2018-01-01 00:00:00"],
];
const c = a.buildQuery(a.queryBuilder);
const parser = new ArrayQueryResultParser((c instanceof GroupByExpression ? c.groupBy : []).concat(c.columns), db);
const res = parser.parse(dummyDatas);
const util = require("util");
let result = util.inspect(res, false, null);
// result = result.replace(/\s+/g, " ");
console.log(result);
// const a = db.orderDetails;
// const param = new ParameterExpression("o", db.orderDetails.type);
// const b = new GroupByQueryable(a, new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "OrderDate"), [param]));
// const param1 = new ParameterExpression("o", GroupedExpression as any);
// const c1 = new SelectQueryable(b, new FunctionExpression(new ObjectValueExpression({
//     date: new MemberAccessExpression(param1, "key"),
//     count: new MethodCallExpression(param1, "count", []),
//     avg: new MethodCallExpression(param1, "avg", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]),
//     max: new MethodCallExpression(param1, "max", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]),
//     min: new MethodCallExpression(param1, "min", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]),
//     sum: new MethodCallExpression(param1, "sum", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])])
// }), [param1]));
// const dummyDatas = [
//     ["2018-01-01", "1", "1", "1", "1", "1"],
//     ["2018-01-01", "1", "1", "1", "1", "1"],
//     ["2018-01-01", "2", "6", "10", "2", "12"],
//     ["2018-01-01", "2", "6", "10", "2", "12"]
// ];
// const c = c1.buildQuery(c1.queryBuilder);
// const parser = new ArrayQueryResultParser(c.columns, db);
// const res = parser.parse(dummyDatas);
// console.log(JSON.stringify(res));


// const param = new ParameterExpression("o", db.orderDetails.type);
// let a = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param, "Order"), [param]));
// a.toString();
// const w = new WhereQueryable(db.orderDetails, new FunctionExpression(new NotExpression(new MemberAccessExpression(param, "isDeleted")), [param]));
// a = new SelectQueryable(w, new FunctionExpression(new MemberAccessExpression(param, "Order"), [param]));
// console.log(a.toString());
// debugger;

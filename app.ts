"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression, StrictEqualExpression, AndExpression, OrExpression, LessThanExpression } from "./src/ExpressionBuilder/Expression/index";
import { InnerJoinQueryable, SelectManyQueryable, SelectQueryable, WhereQueryable, UnionQueryable, IntersectQueryable, ExceptQueryable, PivotQueryable } from "./src/Linq/Queryable/index";
import { JoinQueryable } from "./src/Linq/Queryable/JoinQueryable";
import { SelectExpression } from "./src/Linq/Queryable/QueryExpression/index";
import { MyDb } from "./test/Common/MyDb";
import { Order, OrderDetail } from "./test/Common/Model/index";
import { WhereEnumerable } from "./src/Linq/Enumerable/WhereEnumerable";
import { Enumerable } from "./src/Linq/Enumerable/Enumerable";

// import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// const expressionBuilder = new ExpressionBuilder();
// const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // tslint:disable-next-line:no-console
// console.log(result);

const db = new MyDb({});
const param = new ParameterExpression("o", db.orders.type);
const param2 = new ParameterExpression("p", OrderDetail);
const a = new GreaterThanExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "count", []), new ValueExpression(2));
const b = new WhereQueryable(db.orders, new FunctionExpression(a, [param]));
const c1 = new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]);
const c = new LessThanExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "max", [c1]), new ValueExpression(new Date(2018, 0, 1)));
const d = new WhereQueryable(b, new FunctionExpression(c, [param]));

// tslint:disable-next-line:no-console
const date = new Date();
console.log(d.toString());
// tslint:disable-next-line:no-console
console.log(((new Date()).valueOf() - date.valueOf()) / (1000));

// const param = new ParameterExpression("o", db.orders.type);
// const param2 = new ParameterExpression("od", db.orderDetails.type);
// const a = new SelectQueryable(new WhereQueryable(db.orders, new FunctionExpression(new GreaterThanExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param])), new FunctionExpression(new MemberAccessExpression(param, "OrderDate"), [param]));
// const b = new SelectQueryable(new WhereQueryable(db.orderDetails, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param2, "CreatedDate"), new ValueExpression(new Date(2018, 0, 1))), [param2])), new FunctionExpression(new MemberAccessExpression(param2, "CreatedDate"), [param2]));
// const c = new IntersectQueryable(a, b);
// const param3 = new ParameterExpression("u", c.type);
// const d = new WhereQueryable(c, new FunctionExpression(new GreaterEqualExpression(param3, new ValueExpression(new Date(2018, 0, 1))), [param3]));
// console.log(d.toString());

// const param = new ParameterExpression("o", db.orders.type);
// const a = new SelectQueryable(db.orders, new FunctionExpression(new MemberAccessExpression(param, "OrderId"), [param]));
// console.log(a.toString());

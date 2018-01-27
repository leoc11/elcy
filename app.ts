"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression } from "./src/ExpressionBuilder/Expression/index";
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

const param = new ParameterExpression("o", db.orderDetails.type);
const param1 = new ParameterExpression("o", Enumerable);
// const param2 = new ParameterExpression("od", db.orderDetails.type);
const a = new ObjectValueExpression({
    date: new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "OrderDate"), [param])
});
const b = new ObjectValueExpression({
    avg: new FunctionExpression(new MethodCallExpression(param1, "avg", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]), [param1]),
    // count: new FunctionExpression(new MethodCallExpression(param1, "count", []), [param1]),
    max: new FunctionExpression(new MethodCallExpression(param1, "max", [new FunctionExpression(new MemberAccessExpression(param, "OrderDetailId"), [param])]), [param1]),
    min: new FunctionExpression(new MethodCallExpression(param1, "min", [new FunctionExpression(new MemberAccessExpression(param, "OrderDetailId"), [param])]), [param1]),
    // totalSum: new FunctionExpression(new MethodCallExpression(param1, "sum", [new FunctionExpression(new MemberAccessExpression(new MemberAccessExpression(param, "Order"), "Total"), [param])]), [param1])
});
const c = new PivotQueryable(db.orderDetails, a, b);
// tslint:disable-next-line:no-console
const date = new Date();
console.log(c.toString());
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
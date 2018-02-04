"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression, StrictEqualExpression, AndExpression, OrExpression, LessThanExpression, NotEqualExpression } from "./src/ExpressionBuilder/Expression/index";
import { InnerJoinQueryable, SelectManyQueryable, SelectQueryable, WhereQueryable, UnionQueryable, IntersectQueryable, ExceptQueryable, PivotQueryable, GroupByQueryable } from "./src/Linq/Queryable/index";
import { JoinQueryable } from "./src/Linq/Queryable/JoinQueryable";
import { SelectExpression } from "./src/Linq/Queryable/QueryExpression/index";
import { MyDb } from "./test/Common/MyDb";
import { Order, OrderDetail } from "./test/Common/Model/index";
import { WhereEnumerable } from "./src/Linq/Enumerable/WhereEnumerable";
import { Enumerable } from "./src/Linq/Enumerable/Enumerable";
import { GroupedExpression } from "./src/Linq/Queryable/QueryExpression/GroupedExpression";
import { Queryable } from "./src/Linq/Queryable/Queryable";

// // import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// // const expressionBuilder = new ExpressionBuilder();
// // const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // // tslint:disable-next-line:no-console
// // console.log(result);

const db = new MyDb({});
const param = new ParameterExpression("o", db.orders.type);
const param2 = new ParameterExpression("od", db.orderDetails.type);
const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
const a = new SelectQueryable(w, new FunctionExpression(new MethodCallExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "where", [new FunctionExpression(new NotEqualExpression(new MemberAccessExpression(param2, "OrderId"), new ValueExpression(null)), [param2])]), "all", [new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param2, "name"), "like", [new ValueExpression("%a%")]), [param2])]), [param]));

console.log(a.toString());

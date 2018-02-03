"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression, StrictEqualExpression, AndExpression, OrExpression, LessThanExpression } from "./src/ExpressionBuilder/Expression/index";
import { InnerJoinQueryable, SelectManyQueryable, SelectQueryable, WhereQueryable, UnionQueryable, IntersectQueryable, ExceptQueryable, PivotQueryable, GroupByQueryable } from "./src/Linq/Queryable/index";
import { JoinQueryable } from "./src/Linq/Queryable/JoinQueryable";
import { SelectExpression } from "./src/Linq/Queryable/QueryExpression/index";
import { MyDb } from "./test/Common/MyDb";
import { Order, OrderDetail } from "./test/Common/Model/index";
import { WhereEnumerable } from "./src/Linq/Enumerable/WhereEnumerable";
import { Enumerable } from "./src/Linq/Enumerable/Enumerable";
import { GroupedExpression } from "./src/Linq/Queryable/QueryExpression/GroupedExpression";

// // import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// // const expressionBuilder = new ExpressionBuilder();
// // const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // // tslint:disable-next-line:no-console
// // console.log(result);

const db = new MyDb({});
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
console.log(c.toString());

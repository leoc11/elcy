"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression } from "./src/ExpressionBuilder/Expression/index";
import { InnerJoinQueryable, SelectManyQueryable, SelectQueryable, WhereQueryable } from "./src/Linq/Queryable/index";
import { JoinQueryable } from "./src/Linq/Queryable/JoinQueryable";
import { SelectExpression } from "./src/Linq/Queryable/QueryExpression/index";
import { MyDb } from "./test/Common/MyDb";
import { Order, OrderDetail } from "./test/Common/Model/index";

// import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// const expressionBuilder = new ExpressionBuilder();
// const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // tslint:disable-next-line:no-console
// console.log(result);

const db = new MyDb({});
// const param = new ParameterExpression("o", db.orders.type);
// const param2 = new ParameterExpression("od", db.orderDetails.type);
// const w = new WhereQueryable(db.orders, new FunctionExpression(new GreaterEqualExpression(new MemberAccessExpression(param, "Total"), new ValueExpression(10000)), [param]));
// const b = new InnerJoinQueryable(w, db.orderDetails, new FunctionExpression(new MemberAccessExpression(param, "OrderId"), [param]), new FunctionExpression(new MemberAccessExpression(param2, "OrderId"), [param2]),
//     new FunctionExpression(new ObjectValueExpression({
//         OD: new MemberAccessExpression<Order | OrderDetail, any>(param2, "name"),
//         Order: new MemberAccessExpression(param, "Total")
//     }), [param, param2]));
// const a = new SelectQueryable(w, new FunctionExpression(new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "first", []), [param]));
const param = new ParameterExpression("o", db.orderDetails.type);
const a = new SelectQueryable(db.orderDetails, new FunctionExpression(new MemberAccessExpression(param, "Order"), [param]));

// tslint:disable-next-line:no-console
console.log(a.toString());

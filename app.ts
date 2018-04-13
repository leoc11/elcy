"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression, StrictEqualExpression, AndExpression, OrExpression, LessThanExpression, NotEqualExpression, AdditionExpression } from "./src/ExpressionBuilder/Expression/index";
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

const db = new MyDb();
(async () => {
    const param = new ParameterExpression("o", Order);
    const odParam = new ParameterExpression("od", OrderDetail);

    // toArray
    // const er = await db.orders.toArray();

    // include projection
    // const projection = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "TotalAmount"), [param])]);
    // const a = await projection.toArray();

    // include to many
    // const include = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param])]);
    // const c = await include.toArray();

    // include.include
    // const pa = new MemberAccessExpression(param, "OrderDetails");
    // const pb = new FunctionExpression(new MemberAccessExpression(odParam, "Product"), [odParam]);
    // const pa1 = new FunctionExpression(new MethodCallExpression(pa, "include", [pb]), [param]);
    // const include = new IncludeQueryable(db.orders, [pa1]);
    // const c = await include.toArray();

    // // include to single
    // const odInclude = new IncludeQueryable(db.orderDetails, [new FunctionExpression(new MemberAccessExpression(odParam, "Order"), [odParam])]);
    // const s = await odInclude.toArray();

    // include 2
    // const a = new FunctionExpression(new MemberAccessExpression(odParam, "Order"), [odParam]);
    // const b = new FunctionExpression(new MemberAccessExpression(odParam, "Product"), [odParam]);
    // const odInclude = new IncludeQueryable(db.orderDetails, [a, b]);
    // const c = await odInclude.toArray();

    // select column
    // const selectFn = new FunctionExpression(new MemberAccessExpression(param, "OrderDate") , [param]);
    // const select = new SelectQueryable(db.orders, selectFn);
    // const s = await select.toArray();

    // select object
    // const selectFn = new FunctionExpression(new ObjectValueExpression({
    //     date: new MemberAccessExpression(param, "OrderDate"),
    //     amount: new AdditionExpression(new MemberAccessExpression(param, "TotalAmount"), new ValueExpression(1.2))
    // }) , [param]);
    // const select = new SelectQueryable(db.orders, selectFn);
    // const s = await select.toArray();

    // select object navigation
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     date: new MemberAccessExpression(new MemberAccessExpression(odParam, "Order"), "OrderDate"),
    // }), [odParam]);
    // const select1 = new SelectQueryable(db.orderDetails, selectFn1);
    // const s1 = await select1.toArray();

    // select object to many navigation
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     ods: new MemberAccessExpression(param, "OrderDetails"),
    // }), [param]);
    // const select1 = new SelectQueryable(db.orders, selectFn1);
    // const s1 = await select1.toArray();

    // select object to many navigation
    const selectFn1 = new FunctionExpression(new ObjectValueExpression({
        prod: new MemberAccessExpression(odParam, "Product"),
    }), [odParam]);
    const select1 = new SelectQueryable(db.orderDetails, selectFn1);
    const s1 = await select1.toArray();

    const d = 1;
})();
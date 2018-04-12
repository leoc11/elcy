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

const db = new MyDb();
(async () => {
    const param = new ParameterExpression("o", Order);
    const odParam = new ParameterExpression("od", OrderDetail);

    // const er = await db.orders.toArray();
    // const projection = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "TotalAmount"), [param])]);
    // const a = await projection.toArray();

    // const include = new IncludeQueryable(db.orders, [new FunctionExpression(new MemberAccessExpression(param, "OrderDetails"), [param])]);
    // const c = await include.toArray();

    const pa = new MemberAccessExpression(param, "OrderDetails");
    const pb = new FunctionExpression(new MemberAccessExpression(odParam, "Product"), [odParam]);
    const pa1 = new FunctionExpression(new MethodCallExpression(pa, "include", [pb]), [param]);
    const include = new IncludeQueryable(db.orders, [pa1]);
    const c = await include.toArray();

    const d = 1;
    // const odInclude = new IncludeQueryable(db.orderDetails, [new FunctionExpression(new MemberAccessExpression(param, "Order"), [odParam])]);
    // const d = await include.toArray();

    // next: include.include, include(a, b)
    // select
})();
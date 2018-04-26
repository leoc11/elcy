"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NegationExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression, StrictEqualExpression, AndExpression, OrExpression, LessThanExpression, NotEqualExpression, AdditionExpression, LessEqualExpression, MultiplicationExpression } from "./src/ExpressionBuilder/Expression/index";
import { InnerJoinQueryable, SelectManyQueryable, SelectQueryable, WhereQueryable, UnionQueryable, IntersectQueryable, ExceptQueryable, PivotQueryable, GroupByQueryable, OrderQueryable } from "./src/Queryable/index";
import { JoinQueryable } from "./src/Queryable/JoinQueryable";
import { SelectExpression, GroupByExpression } from "./src/Queryable/QueryExpression/index";
import { MyDb } from "./test/Common/MyDb";
import { Order, OrderDetail } from "./test/Common/Model/index";
import { WhereEnumerable } from "./src/Enumerable/WhereEnumerable";
import { Enumerable } from "./src/Enumerable/Enumerable";
import { GroupedExpression } from "./src/Queryable/QueryExpression/GroupedExpression";
import { Queryable } from "./src/Queryable/Queryable";
import { IncludeQueryable } from "./src/Queryable/IncludeQueryable";
import { ArrayQueryResultParser } from "./src/QueryBuilder/ResultParser/ArrayQueryResultParser";
import { IQueryableOrderDefinition } from "./src/QueryBuilder/Interface/IOrderDefinition";
import { OrderDirection } from "./src/Common/Type";
import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";
import "./src/Extensions/DateExtension";
import { TakeEnumerable } from "./src/Enumerable";

// // import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// // const expressionBuilder = new ExpressionBuilder();
// // const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // // tslint:disable-next-line:no-console
// // console.log(result);

const db = new MyDb();
(async () => {
    const param = new ParameterExpression("o", Order);
    const odParam = new ParameterExpression("od", OrderDetail);



    /**
     * GROUP BY
     */

    // groupby
    // const gb1 = await db.orders.groupBy(o => o.OrderDate).toArray();

    // groupby select
    // const gb11 = await db.orders.groupBy(o => o.OrderDate).select(o => ({
    //     date: o.key.getDate(),
    //     max: o.where(od => od.TotalAmount < 20000).max(od => od.TotalAmount)
    // })).toArray();

    // const gb11 = await db.orders.groupBy(o => o.OrderDate).select(o => ({
    //     orders2: o.where(od => od.TotalAmount < 20000)
    // })).toArray();

    // const gb11 = await db.orderDetails.groupBy(o => o.Order).select(o => ({
    //     order: o.key
    // })).toArray();

    // groupby navigation property
    // const gb2 = await db.orderDetails.groupBy(o => o.Product).toArray();

    // groupby object
    // const gb3 = await db.orders.groupBy(o => ({
    //     date: o.OrderDate,
    //     totalItems: o.OrderDetails.sum(p => p.quantity)
    // })).toArray();

    // groupby object with navigation property
    // const gb4 = await db.orderDetails.groupBy(o => ({
    //     order: o.Order,
    //     price: o.Product.Price
    // })).toArray();

    const d = 1;
    

})();

"use strict";
import { EqualExpression, FunctionExpression, GreaterEqualExpression, MemberAccessExpression, MethodCallExpression, NotExpression, ParameterExpression, ValueExpression, ObjectValueExpression, GreaterThanExpression, StrictEqualExpression, AndExpression, OrExpression, LessThanExpression, NotEqualExpression, AdditionExpression, LessEqualExpression, MultiplicationExpression } from "./src/ExpressionBuilder/Expression/index";
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

    // toArray
    // const er = await db.orders.toArray();


    /**
     * INCLUDE
     */

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


    /**
     * SELECT
     */

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

    // select object to scalar navigation
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     prod: new MemberAccessExpression(odParam, "Product"),
    // }), [odParam]);
    // const select1 = new SelectQueryable(db.orderDetails, selectFn1);
    // const s1 = await select1.toArray();

    // select object to many navigation select
    // const innerSelect = new FunctionExpression(new ObjectValueExpression({
    //     name: new MemberAccessExpression(odParam, "name")
    // }), [odParam]);
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     simpleOrderDetails: new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "select", [innerSelect]),
    // }), [param]);
    // const select1 = new SelectQueryable(db.orders, selectFn1);
    // const s1 = await select1.toArray();

    // select object to many navigation select object
    // const innerSelect = new FunctionExpression(new ObjectValueExpression({
    //     prod: new MemberAccessExpression(odParam, "Product")
    // }), [odParam]);
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     simpleOrderDetails: new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "select", [innerSelect]),
    // }), [param]);
    // const select1 = new SelectQueryable(db.orders, selectFn1);
    // const s1 = await select1.toArray();

    // select object with self
    // const innerSelect = new FunctionExpression(new ObjectValueExpression({
    //     od: odParam,
    //     Price: new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price")
    // }), [odParam]);
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     simpleOrderDetails: new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "select", [innerSelect]),
    // }), [param]);
    // const select1 = new SelectQueryable(db.orders, selectFn1);
    // const s1 = await select1.toArray();

    // select array
    // const s1 = await db.orders.select(o => o.OrderDetails).toArray();


    /**
     * WHERE
     */

    // where
    // const predicate = new FunctionExpression(
    //     new LessEqualExpression(
    //         new MemberAccessExpression(param, "TotalAmount"), 
    //         new ValueExpression(10000)), 
    // [param]);
    // const whereQuery = new WhereQueryable(db.orders, predicate);
    // const w1 = await whereQuery.toArray();

    // where include
    // const predicate = new FunctionExpression(
    //     new LessEqualExpression(
    //         new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
    //         new ValueExpression(15000)),
    //     [odParam]);
    // const whereExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "where", [predicate]);
    // const include = new IncludeQueryable(db.orders, [new FunctionExpression(whereExp, [param])]);
    // const c = await include.toArray();

    // where select
    // const predicate = new FunctionExpression(
    //     new LessEqualExpression(
    //         new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
    //         new ValueExpression(15000)),
    //     [odParam]);
    // const whereExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "where", [predicate]);
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     ods: whereExp,
    // }), [param]);
    // const select1 = new SelectQueryable(db.orders, selectFn1);
    // const s1 = await select1.toArray();

    // where where
    // let predicate = new FunctionExpression(
    //     new LessEqualExpression(
    //         new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
    //         new ValueExpression(15000)),
    // [odParam]);
    // let whereQuery = new WhereQueryable(db.orderDetails, predicate);
    // predicate = new FunctionExpression(
    //     new MethodCallExpression(
    //         new MemberAccessExpression(odParam, "name"),
    //         "like", [new ValueExpression("%a%")]),
    // [odParam]);
    // whereQuery = new WhereQueryable(whereQuery, predicate);
    // const w1 = await whereQuery.toArray();

    /**
     * ORDER
     */

    // order
    // const selector: IQueryableOrderDefinition = {
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(param, "TotalAmount"), 
    //     [param]),
    //     direction: OrderDirection.DESC
    // };
    // const orderQuery = new OrderQueryable(db.orders, selector);
    // const w1 = await orderQuery.toArray();

    // Order related entity column
    // const selector: IQueryableOrderDefinition = {
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"), 
    //     [odParam]),
    //     direction: OrderDirection.DESC
    // };
    // const orderQuery = new OrderQueryable(db.orderDetails, selector);
    // const w1 = await orderQuery.toArray();

    // Order computed column
    // const selector: IQueryableOrderDefinition = {
    //     selector: new FunctionExpression(
    //         new MultiplicationExpression(new MemberAccessExpression(odParam, "quantity"), new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price")), 
    //     [odParam]),
    //     direction: OrderDirection.DESC
    // };
    // const orderQuery = new OrderQueryable(db.orderDetails, selector);
    // const w1 = await orderQuery.toArray();

    // Order.order
    // const selector: IQueryableOrderDefinition = {
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(odParam, "quantity"),
    //         [odParam])
    // };
    // const selector2: IQueryableOrderDefinition = {
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
    //         [odParam]),
    //     direction: OrderDirection.DESC
    // };
    // const orderQuery = new OrderQueryable(db.orderDetails, ...[selector, selector2]);
    // const w1 = await orderQuery.toArray();

    // Order + order
    // Note: thought Product no longer used, it still exist in join statement.
    // const selector: IQueryableOrderDefinition = {
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
    //         [odParam]),
    //     direction: OrderDirection.DESC
    // };
    // let orderQuery = new OrderQueryable(db.orderDetails, selector);
    // const selector2: IQueryableOrderDefinition = {
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(odParam, "quantity"),
    //         [odParam])
    // };
    // orderQuery = new OrderQueryable(orderQuery, selector2);
    // const w1 = await orderQuery.toArray();

    // Order in include
    // const selector = new ObjectValueExpression({
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(new MemberAccessExpression(odParam, "Product"), "Price"),
    //         [odParam]),
    //     direction: new ValueExpression(OrderDirection.DESC)
    // });
    // const orderExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "orderBy", [selector]);
    // const include = new IncludeQueryable(db.orders, [new FunctionExpression(orderExp, [param])]);
    // const c = await include.toArray();

    // order in select
    // const selector = new ObjectValueExpression({
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(odParam, "quantity"),
    //         [odParam])
    // });
    // const orderExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "orderBy", [selector]);
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     ods: orderExp,
    // }), [param]);
    // const select1 = new SelectQueryable(db.orders, selectFn1);
    // const s1 = await select1.toArray();

    /**
     * Expression Builder
     */

    // const ori = new FunctionExpression(new MemberAccessExpression(param, "TotalAmount"), [param]);
    // const a = Date.now();
    // const builded = ExpressionBuilder.parse((o: Order) => o.TotalAmount);
    // console.log(Date.now() - a);
    // console.log(ori.toString() === builded.toString());


    // const selector = new ObjectValueExpression({
    //     selector: new FunctionExpression(
    //         new MemberAccessExpression(odParam, "quantity"),
    //         [odParam])
    // });
    // const orderExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "orderBy", [selector]);
    // const selectFn1 = new FunctionExpression(new ObjectValueExpression({
    //     ods: orderExp,
    // }), [param]);
    // const a = Date.now();
    // const build1 = ExpressionBuilder.parse((o: Order) => ({
    //     ods: o.OrderDetails.orderBy({
    //         selector: (od: OrderDetail) => od.quantity
    //     })
    // }), [Order]);
    // console.log(Date.now() - a);

    // const c = await db.orders.any();

    // const paramObj = { now: (new Date()).addYears(-1) };
    // const c = await db.orders.setParameters({ paramObj }).where(o => o.OrderDate < new Date()).toArray();

    // computed property in memory
    // const c = await db.orderDetails.include(o => o.Product).take(2).toArray();

    // computed property in query
    // const c = await db.orderDetails.include(o => o.GrossSales).take(2).toArray();


    /**
     * SELECT MANY
     */

    // selectMany
    // const sm = await db.orders.selectMany(o => o.OrderDetails).toArray();

    // select selectMany
    // const sm = await db.orders.select(o => ({
    //     amount: o.TotalAmount,
    //     orderDs: o.OrderDetails.selectMany(od => od.OrderDetailProperties)
    // })).toArray();


    /**
     * ANY
     */

    // any
    // const c = await db.orders.any();

    // select any
    // const any = await db.orders.select(o => ({
    //     order: o,
    //     hasDetail: o.OrderDetails.any(od => od.Product.Price < 20000)
    // })).toArray();

    // where any
    const any = await db.orders.where(o => o.OrderDetails.any()).toArray();

    const d = 1;
})();
"use strict";
import { MyDb } from "./test/Common/MyDb";
import "./src/Extensions/DateExtension";
import { OrderDirection } from "./src/Common/Type";
import { entityMetaKey } from "./src/Decorator/DecoratorKey";
import { CollectionProductData, Collection, Product, Order } from "./test/Common/Model";
import { IncludeQueryable } from "./src/Queryable/IncludeQueryable";
import { FunctionExpression } from "./src/ExpressionBuilder/Expression/FunctionExpression";
import { MemberAccessExpression } from "./src/ExpressionBuilder/Expression/MemberAccessExpression";

// // import { ExpressionBuilder } from "./src/ExpressionBuilder/ExpressionBuilder";

// // const expressionBuilder = new ExpressionBuilder();
// // const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
// // // tslint:disable-next-line:no-console
// // console.log(result);

const db = new MyDb();
(async () => {
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

    /// const where = await db.orderDetailProperties.groupBy(o => o.OrderDetail.Order).toArray();

    // const groupBy = await db.orderDetailProperties.groupBy(o => o.OrderDetail.Order).select(o => o.key.OrderDate).toArray();
    
    const distinct = await db.orders.select(o => o.TotalAmount).contains(20000);
    const d = 1;
})();

import { IncludeQueryable } from "../src/Queryable/IncludeQueryable";
import { MyDb } from "./Common/MyDb";
import { FunctionExpression, MemberAccessExpression, ParameterExpression, MethodCallExpression, ObjectValueExpression, } from "../src/ExpressionBuilder/Expression";
import { Order, OrderDetail, Product } from "./Common/Model";
import "mocha";
import { expect, should } from "chai";
import { ExpressionBuilder } from "../src/ExpressionBuilder/ExpressionBuilder";

const param = new ParameterExpression("o", Order);
const odParam = new ParameterExpression("od", OrderDetail);
describe("Query builder Parse", () => {
    it("member access expression", async () => {
        const ori = new FunctionExpression(new MemberAccessExpression(param, "TotalAmount"), [param]);
        const builded = ExpressionBuilder.parse((o: Order) => o.TotalAmount);
        expect(ori.toString() === builded.toString());
    });
    it("ObjectValueExpression", async () => {
        const selector = new ObjectValueExpression({
            selector: new FunctionExpression(
                new MemberAccessExpression(odParam, "quantity"),
                [odParam])
        });
        const orderExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "orderBy", [selector]);
        const ori = new FunctionExpression(new ObjectValueExpression({
            ods: orderExp,
        }), [param]);
        const build = ExpressionBuilder.parse((o: Order) => ({
            ods: o.OrderDetails.orderBy({
                selector: (od: OrderDetail) => od.quantity
            })
        }), [Order]);
        expect(ori.toString() === build.toString());
    });
});
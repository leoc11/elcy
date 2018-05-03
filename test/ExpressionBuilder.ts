import { FunctionExpression, MemberAccessExpression, ParameterExpression, MethodCallExpression, ObjectValueExpression, FunctionCallExpression, ValueExpression, } from "../src/ExpressionBuilder/Expression";
import { Order, OrderDetail } from "./Common/Model";
import "mocha";
import { expect } from "chai";
import { ExpressionBuilder } from "../src/ExpressionBuilder/ExpressionBuilder";

const param = new ParameterExpression("o", Order);
const odParam = new ParameterExpression("od", OrderDetail);
describe("EXPRESSION BUILDER", () => {
    it("member access expression", async () => {
        const ori = new FunctionExpression(new MemberAccessExpression(param, "TotalAmount"), [param]);
        const builded = ExpressionBuilder.parse((o: Order) => o.TotalAmount);
        expect(ori.toString() === builded.toString());
    });
    it("should identify object declaration", async () => {
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
    it("should identify regexp", async () => {
        const ori = new FunctionExpression(
            new MethodCallExpression(new ValueExpression(/test/ig), "test", [new ParameterExpression("a", String)])
        , [new ParameterExpression("a", String)]);
        const build = ExpressionBuilder.parse((a: string) => /test/ig.test(a), [String]);
        expect(ori.toString() === build.toString());
    });
});
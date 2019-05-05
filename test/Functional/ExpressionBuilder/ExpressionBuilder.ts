import { Order, OrderDetail } from "../../Common/Model";
import "mocha";
import { expect } from "chai";
import { ExpressionBuilder } from "../../../src/ExpressionBuilder/ExpressionBuilder";
import { ParameterExpression } from "../../../src/ExpressionBuilder/Expression/ParameterExpression";
import { MemberAccessExpression } from "../../../src/ExpressionBuilder/Expression/MemberAccessExpression";
import { FunctionExpression } from "../../../src/ExpressionBuilder/Expression/FunctionExpression";
import { ArrayValueExpression } from "../../../src/ExpressionBuilder/Expression/ArrayValueExpression";
import { MethodCallExpression } from "../../../src/ExpressionBuilder/Expression/MethodCallExpression";
import { ObjectValueExpression } from "../../../src/ExpressionBuilder/Expression/ObjectValueExpression";
import { ValueExpression } from "../../../src/ExpressionBuilder/Expression/ValueExpression";
import { ExpressionExecutor } from "../../../src/ExpressionBuilder/ExpressionExecutor";

const param = new ParameterExpression("o", Order);
const odParam = new ParameterExpression("od", OrderDetail);
describe("EXPRESSION BUILDER", () => {
    it("member access expression", async () => {
        const ori = new FunctionExpression(new MemberAccessExpression(param, "TotalAmount"), [param]);
        const builded = ExpressionBuilder.parse((o: Order) => o.TotalAmount);
        expect(ori.toString() === builded.toString());
    });
    it("should identify object declaration", async () => {
        const selector = new ArrayValueExpression(...[
            new FunctionExpression(
                new MemberAccessExpression(odParam, "quantity"),
                [odParam])
        ]);
        const orderExp = new MethodCallExpression(new MemberAccessExpression(param, "OrderDetails"), "orderBy", [selector]);
        const ori = new FunctionExpression(new ObjectValueExpression({
            ods: orderExp,
        }), [param]);
        const build = ExpressionBuilder.parse((o: Order) => ({
            ods: o.OrderDetails.orderBy([(od: OrderDetail) => od.quantity])
        }));
        expect(ori.toString() === build.toString());
    });
    it("should identify regexp", async () => {
        const ori = new FunctionExpression(
            new MethodCallExpression(new ValueExpression(/test/ig), "test", [new ParameterExpression("a", String)])
            , [new ParameterExpression("a", String)]);
        const build = ExpressionBuilder.parse((a: string) => /test/ig.test(a));
        expect(ori.toString() === build.toString());
    });
    it("should identify operator", () => {
        type testType = { member: number, method: (a: number) => number };
        const bitFns: Array<(a: any) => any> = [
            (a: number) => a & 2,
            (a: number) => a | 2,
            (a: number) => ~a,
            (a: number) => a >>> 2,
            (a: number) => a << 2,
            (a: number) => a >> 2,
            (a: number) => a ^ 2,
            (a: number) => a === 2,
            // tslint:disable-next-line:triple-equals
            (a: number) => a == 2,
            (a: number) => !(a === 2),
            (a: number) => a !== 2,
            // tslint:disable-next-line:triple-equals
            (a: number) => a != 2,
            (a: number) => a >= 2,
            (a: number) => a > 2,
            (a: number) => a <= 2,
            (a: number) => a < 2,
            (a: number) => a >= 2 && a <= 4,
            (a: number) => a < 2 || a > 4,
            (a: number) => a + 2,
            (a: number) => a - 2,
            (a: number) => -a,
            (a: number) => a++,
            (a: number) => a--,
            (a: number) => ++a,
            (a: number) => a--,
            (a: number) => a * 2,
            (a: number) => a / 2,
            (a: number) => a ** 2,
            (a: number) => a % 2,
            (a: number) => a <= 10 ? a : 10,


            (obj: testType) => obj.member,
            (obj: testType) => obj.method(10),
            (obj: testType) => obj instanceof Object,
            (obj: testType) => typeof obj === "object",
            (obj: testType) => ({ member: obj.member, member2: obj.method(2) }),
            (obj: testType) => [obj.member, obj.method(2)],
            (obj: testType) => new Date(obj.member),

            // Assignment
            (a: number) => a &= 2,
            (a: number) => a |= 2,
            (a: number) => a >>>= 2,
            (a: number) => a <<= 2,
            (a: number) => a += 2,
            (a: number) => a -= 2,
            (a: number) => a /= 2,
            (a: number) => a *= 2,
            (a: number) => a **= 2,
            (a: number) => a %= 2,
            (a: number) => a ^= 2
        ];

        const paramObj = { a: 10, b: "string", obj: { member: 10, method: function (a: number) { return this.member + a; } } };
        for (const fn of bitFns) {
            const exp = ExpressionBuilder.parse(fn, paramObj);
            expect(fn.toString().replace(/[() ]/g, "")).to.equal(exp.toString().replace(/[() ]/g, ""));

            const executor = new ExpressionExecutor(paramObj);
            const paramName = exp.params[0].name;
            const expVal = executor.execute(exp);
            const fnVal = fn(paramObj[paramName]);
            expect(JSON.stringify(fnVal)).to.equal(JSON.stringify(expVal));
        }
    });
});
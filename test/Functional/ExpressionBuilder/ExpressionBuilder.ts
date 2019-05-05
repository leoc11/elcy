import "mocha";
import { expect } from "chai";
import { ExpressionBuilder } from "../../../src/ExpressionBuilder/ExpressionBuilder";
import { ExpressionExecutor } from "../../../src/ExpressionBuilder/ExpressionExecutor";

describe("EXPRESSION BUILDER", () => {
    it("should build correct expression", () => {
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
            (a: number) => --a,
            (a: number) => a--,
            (a: number) => ++a,
            (a: number) => a++,
            (a: number) => a * 2,
            (a: number) => a / 2,
            (a: number) => a ** 2,
            (a: number) => a % 2,
            (a: number) => a <= 10 ? a : 10,

            (b: string) => `${b}string` + "s\"tring",
            (b: string) => /st..ng/ig.test(b),

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
            (a: number) => a >>= 2,
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

            const clone = exp.clone();
            expect(exp.toString()).to.equal(clone.toString());

            const executor = new ExpressionExecutor(paramObj);
            const paramName = exp.params[0].name;
            const expVal = executor.execute(exp);
            const fnVal = fn(paramObj[paramName]);
            expect(JSON.stringify(fnVal)).to.equal(JSON.stringify(expVal));
        }
    });
    it("should identify comment", () => {
        const bitFns: Map<(a: any) => any, string> = new Map([
            [(a: number) => /* comment */ a & 2, "(a) => (a & 2)"],
            [(a: number) => {
                // comment
                return a;
            }, "(a) => a"]
        ]);

        const paramObj = { a: 10 };
        for (const [fn, fnString] of bitFns) {
            const exp = ExpressionBuilder.parse(fn, paramObj);
            expect(fnString).to.equal(exp.toString());

            const executor = new ExpressionExecutor(paramObj);
            const paramName = exp.params[0].name;
            const expVal = executor.execute(exp);
            const fnVal = fn(paramObj[paramName]);
            expect(JSON.stringify(fnVal)).to.equal(JSON.stringify(expVal));
        }
    });
});
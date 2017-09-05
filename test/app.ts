import { assert } from "chai";
import { ExpressionBuilder } from "../src/ExpressionBuilder/ExpressionBuilder";

describe("Expression Builder", () => {
    const expressionBuilder = new ExpressionBuilder();

    it("parse simple aritmatic", () => {
        const result = expressionBuilder.Parse("1 + 1");
        assert.equal(result, "eq(1, '+', 1)");
    });
    it("should parse with stronger operator first", () => {
        const result = expressionBuilder.Parse("1 + 1 * 2 + 1");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(eq(1, '+', eq(1, '*', 2)), '+', 1)");
    });
    it("parse complex blocks aritmatic", () => {
        const result = expressionBuilder.Parse("((1 + 1)) + (1 + (1 + (1 + 1)) + 1) + 1");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(eq(eq(1, '+', 1), '+', eq(eq(1, '+', eq(1, '+', eq(1, '+', 1))), '+', 1)), '+', 1)");
    });
    it("parse comparison", () => {
        const result = expressionBuilder.Parse("!(1 == '123') || (1 >= 3) && (2 < 3)");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(eq(eq(undefined, '!', eq(1, '==', '123')), '||', eq(1, '>=', 3)), '&&', eq(2, '<', 3))");
    });
    it("parse comparison with priority", () => {
        const result = expressionBuilder.Parse("!(1 == '123') || 1 >= 3 && 2 < 3");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(eq(eq(undefined, '!', eq(1, '==', '123')), '||', eq(1, '>=', 3)), '&&', eq(2, '<', 3))");
    });
    it("parse method and navigation", () => {
        const result = expressionBuilder.Parse("Math.max(parseInt('1,2', '1'), 2 * 3 - 1, arg1.Property + 1)");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(Math, '.', 'max', [Parser.FunctionCall('parseInt', ['1,2', '1']), eq(eq(2, '*', 3), '-', 1), eq(eq(arg1, '.', 'Property'), '+', 1)])");
    });
    it("should remove comments", () => {
        const result = expressionBuilder.Parse("1 + /* 1 + 3 '123123' () /**/ '45/*123*/1' //this is comments");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(1, '+', '45/*123*/1')");
    });
    it("should parse single operand", () => {
        const result = expressionBuilder.Parse("a+++--1");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(eq(a, '++', undefined), '+', eq(undefined, '--', 1))");
    });
    it("should parse ternary", () => {
        const result = expressionBuilder.Parse("Table.Name !== '' ? 'Table' + Table.Name : 'Not found'");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(eq(eq(Table, '.', 'Name'), '!==', ''), '?', eq('Table', '+', eq(Table, '.', 'Name')), 'Not found')");
    });
    it("should parse nested ternary", () => {
        const result = expressionBuilder.Parse("compare1 ? compare2 ? true2 : false2 : compare3 ? true3 : false3");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(compare1, '?', eq(compare2, '?', true2, false2), eq(compare3, '?', true3, false3))");
    });
    it("support array and call it's method", () => {
        const result = expressionBuilder.Parse("([0, 0 + 1, parseInt('123')]).join(',')");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "eq(([0, eq(0, '+', 1), Parser.FunctionCall('parseInt', ['123'])]), '.', 'join', [','])");
    });
    it("support array in array", () => {
        const result = expressionBuilder.Parse("[[0, 0 + 1], [parseInt('123')]]");
        // tslint:disable-next-line:max-line-length
        assert.equal(result, "([([0, eq(0, '+', 1)]), ([Parser.FunctionCall('parseInt', ['123'])])])");
    });
    // it("support access array item with index", () => {
    //     const result = expressionBuilder.Parse("Product.Images[0] == ''");
    //     // tslint:disable-next-line:max-line-length
    //     assert.equal(result, "eq(Product, '.', 'Images')");
    // });
});

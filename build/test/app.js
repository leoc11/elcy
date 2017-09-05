"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var ExpressionBuilder2_1 = require("../src/ExpressionBuilder/ExpressionBuilder2");
describe("Expression Builder", function () {
    var expressionBuilder = new ExpressionBuilder2_1.ExpressionBuilder2();
    it("parse simple aritmatic", function () {
        var result = expressionBuilder.Parse("1 + 1");
        chai_1.assert.equal(result, "eq(1, '+', 1)");
    });
    it("should parse with stronger operator first", function () {
        var result = expressionBuilder.Parse("1 + 1 * 2 + 1");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(eq(1, '+', eq(1, '*', 2)), '+', 1)");
    });
    it("parse complex blocks aritmatic", function () {
        var result = expressionBuilder.Parse("((1 + 1)) + (1 + (1 + (1 + 1)) + 1) + 1");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(eq(eq(1, '+', 1), '+', eq(eq(1, '+', eq(1, '+', eq(1, '+', 1))), '+', 1)), '+', 1)");
    });
    it("parse comparison", function () {
        var result = expressionBuilder.Parse("!(1 == '123') || (1 >= 3) && (2 < 3)");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(eq(eq(undefined, '!', eq(1, '==', '123')), '||', eq(1, '>=', 3)), '&&', eq(2, '<', 3))");
    });
    it("parse comparison with priority", function () {
        var result = expressionBuilder.Parse("!(1 == '123') || 1 >= 3 && 2 < 3");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(eq(eq(undefined, '!', eq(1, '==', '123')), '||', eq(1, '>=', 3)), '&&', eq(2, '<', 3))");
    });
    it("parse method and navigation", function () {
        var result = expressionBuilder.Parse("Math.max(parseInt('1,2', '1'), 2 * 3 - 1, arg1.Property + 1)");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(Math, '.', 'max', [Parser.FunctionCall('parseInt', ['1,2', '1']), eq(eq(2, '*', 3), '-', 1), eq(eq(arg1, '.', 'Property'), '+', 1)])");
    });
    it("should remove comments", function () {
        var result = expressionBuilder.Parse("1 + /* 1 + 3 '123123' () /**/ '45/*123*/1' //this is comments");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(1, '+', '45/*123*/1')");
    });
    it("should parse single operand", function () {
        var result = expressionBuilder.Parse("a+++--1");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(eq(a, '++', undefined), '+', eq(undefined, '--', 1))");
    });
    it("should parse ternary", function () {
        var result = expressionBuilder.Parse("Table.Name !== '' ? 'Table' + Table.Name : 'Not found'");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(eq(eq(Table, '.', 'Name'), '!==', ''), '?', eq('Table', '+', eq(Table, '.', 'Name')), 'Not found')");
    });
    it("should parse nested ternary", function () {
        var result = expressionBuilder.Parse("compare1 ? compare2 ? true2 : false2 : compare3 ? true3 : false3");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(compare1, '?', eq(compare2, '?', true2, false2), eq(compare3, '?', true3, false3))");
    });
    it("support array and call it's method", function () {
        var result = expressionBuilder.Parse("([0, 0 + 1, parseInt('123')]).join(',')");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "eq(([0, eq(0, '+', 1), Parser.FunctionCall('parseInt', ['123'])]), '.', 'join', [','])");
    });
    it("support array in array", function () {
        var result = expressionBuilder.Parse("[[0, 0 + 1], [parseInt('123')]]");
        // tslint:disable-next-line:max-line-length
        chai_1.assert.equal(result, "([([0, eq(0, '+', 1)]), ([Parser.FunctionCall('parseInt', ['123'])])])");
    });
    // it("support access array item with index", () => {
    //     const result = expressionBuilder.Parse("Product.Images[0] == ''");
    //     // tslint:disable-next-line:max-line-length
    //     assert.equal(result, "eq(Product, '.', 'Images')");
    // });
});
//# sourceMappingURL=app.js.map
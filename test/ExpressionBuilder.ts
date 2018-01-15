// import { assert } from "chai";
// import { ExpressionBuilder } from "../src/ExpressionBuilder/ExpressionBuilder";

// describe("Expression Builder", () => {
//     const expressionBuilder = new ExpressionBuilder();

//     it("parse simple aritmatic", () => {
//         const result = expressionBuilder.Parse("1 + 1");
//         assert.equal(result!.ToString(), "(1 + 1)");
//     });
//     it("should parse with stronger operator first", () => {
//         const result = expressionBuilder.Parse("1 + 1 * 2 + 1");
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), "((1 + (1 * 2)) + 1)");
//     });
//     it("parse complex blocks aritmatic", () => {
//         const result = expressionBuilder.Parse("((1 + 1)) + (1 + (1 + (1 + 1)) + 1) + 1");
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), "(((1 + 1) + ((1 + (1 + (1 + 1))) + 1)) + 1)");
//     });
//     it("parse comparison", () => {
//         const result = expressionBuilder.Parse("!(1 == '123') || (1 >= 3) && (2 < 3)");
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '((!(1 == "123") || (1 >= 3)) && (2 < 3))');
//     });
//     it("parse comparison with priority", () => {
//         const result = expressionBuilder.Parse("!(1 == '123') || 1 >= 3 && 2 < 3");
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '((!(1 == "123") || (1 >= 3)) && (2 < 3))');
//     });
//     it("parse method and navigation", () => {
//         const result = expressionBuilder.Parse("Math.max(parseInt('1,2', '1'), 2 * 3 - 1, arg1.Property + 1)", { arg1: { Property: "ARGPROP" } });
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), 'Math.max(parseInt("1,2", "1"), ((2 * 3) - 1), (arg1.Property + 1))');
//     });
//     it("should remove comments", () => {
//         const result = expressionBuilder.Parse("1 + /* 1 + 3 '123123' () /**/ '45/*123*/1' //this is comments");
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '(1 + "45/*123*/1")');
//     });
//     it("should parse single operand", () => {
//         const result = expressionBuilder.Parse("1+++--2");
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), "(1++ + --2)");
//     });
//     it("should parse ternary", () => {
//         const result = expressionBuilder.Parse("Table.Name !== '' ? 'Table' + Table.Name : 'Not found'", { Table: { Name: "RootTable" } });
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '((Table.Name !== "") ? ("Table" + Table.Name) : "Not found")');
//     });
//     it("should parse nested ternary", () => {
//         const result = expressionBuilder.Parse("compare1 ? compare2 ? 21 : 20 : compare3 ? 31 : 30", { compare1: true, compare2: false, compare3: true });
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), "(compare1 ? (compare2 ? 21 : 20) : (compare3 ? 31 : 30))");
//     });
//     it("support array and call it's method", () => {
//         const result = expressionBuilder.Parse('([0, 0 + 1, parseInt("123")]).join(",")');
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '[0, (0 + 1), parseInt("123")].join(",")');
//     });
//     it("support array in array", () => {
//         const result = expressionBuilder.Parse("[[0, 0 + 1], [parseInt('123')]]");
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '[[0, (0 + 1)], [parseInt("123")]]');
//     });
//     it("support anonymous object", () => {
//         const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '{Prop1: 123, Prop2: "345", Prop3: (("1" + 2) + 3)}');
//     });
//     it("support Typed Object", () => {
//         const result = expressionBuilder.Parse('{Prop1: 123, Prop2: "345", Prop3: "1" + 2 + 3}');
//         // tslint:disable-next-line:max-line-length
//         assert.equal(result!.ToString(), '{Prop1: 123, Prop2: "345", Prop3: (("1" + 2) + 3)}');
//     });
//     // it("support access array item with index", () => {
//     //     const result = expressionBuilder.Parse("Product.Images[0] == ''");
//     //     // tslint:disable-next-line:max-line-length
//     //     assert.equal(result, "eq(Product, '.', 'Images')");
//     // });
// });

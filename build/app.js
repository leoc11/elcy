"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExpressionBuilder2_1 = require("./src/ExpressionBuilder/ExpressionBuilder2");
var a = new ExpressionBuilder2_1.ExpressionBuilder2();
var result = a.Parse("compare1 ? compare2 ? true2 : false2 : compare3 ? true3 : false3");
// tslint:disable-next-line:no-console
console.log(result);
//# sourceMappingURL=app.js.map
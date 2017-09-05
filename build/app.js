"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExpressionBuilder_1 = require("./src/ExpressionBuilder/ExpressionBuilder");
var a = new ExpressionBuilder_1.ExpressionBuilder();
var result = a.Parse("compare1 ? compare2 ? true2 : false2 : compare3 ? true3 : false3");
// tslint:disable-next-line:no-console
console.log(result);
//# sourceMappingURL=app.js.map
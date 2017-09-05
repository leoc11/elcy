"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExpressionBuilder_1 = require("./src/ExpressionBuilder/ExpressionBuilder");
var a = new ExpressionBuilder_1.ExpressionBuilder();
var result = a.Parse2("1 - 1 - 1");
// tslint:disable-next-line:no-console
console.log(result.ToString());
//# sourceMappingURL=app.js.map
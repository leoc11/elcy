"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExpressionBase = /** @class */ (function () {
    function ExpressionBase(returnType) {
        if (returnType === undefined)
            this.Type = undefined;
        else if (returnType === null)
            this.Type = null;
        else
            this.Type = returnType.constructor;
    }
    ExpressionBase.prototype.ToString = function () {
        throw new Error("Method not implemented.");
    };
    ExpressionBase.prototype.Execute = function () {
        throw new Error("Method not implemented.");
    };
    return ExpressionBase;
}());
exports.ExpressionBase = ExpressionBase;
//# sourceMappingURL=IExpression.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AdditonExpression = /** @class */ (function () {
    function AdditonExpression(LeftOperand, RightOperand) {
        this.LeftOperand = LeftOperand;
        this.RightOperand = RightOperand;
    }
    AdditonExpression.prototype.ToString = function () {
        return "(" + this.LeftOperand.ToString + " + " + this.RightOperand.ToString() + ")";
    };
    AdditonExpression.prototype.Execute = function () {
        return this.LeftOperand.Execute() + this.RightOperand.Execute();
    };
    return AdditonExpression;
}());
exports.AdditonExpression = AdditonExpression;
//# sourceMappingURL=AdditonExpression.js.map
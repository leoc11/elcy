"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AddOperatorExpression = /** @class */ (function () {
    function AddOperatorExpression(LeftOperand, RightOperand) {
        this.LeftOperand = LeftOperand;
        this.RightOperand = RightOperand;
    }
    AddOperatorExpression.prototype.ToString = function () {
        return "(" + this.LeftOperand.ToString + " + " + this.RightOperand.ToString() + ")";
    };
    AddOperatorExpression.prototype.Execute = function () {
        return this.LeftOperand.Execute() + this.RightOperand.Execute();
    };
    return AddOperatorExpression;
}());
exports.AddOperatorExpression = AddOperatorExpression;
//# sourceMappingURL=AddOperatorExpression.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression_1 = require("./ValueExpression");
var SubstractOperatorExpression = /** @class */ (function () {
    function SubstractOperatorExpression(LeftOperand, RightOperand) {
        this.LeftOperand = LeftOperand;
        this.RightOperand = RightOperand;
    }
    SubstractOperatorExpression.Create = function (leftOperand, rightOperand) {
        if (leftOperand instanceof ValueExpression_1.ValueExpression && rightOperand instanceof ValueExpression_1.ValueExpression)
            return new ValueExpression_1.ValueExpression(leftOperand.Execute() + rightOperand.Execute());
        else
            return new SubstractOperatorExpression(leftOperand, rightOperand);
    };
    SubstractOperatorExpression.prototype.ToString = function () {
        return "(" + this.LeftOperand.ToString + " - " + this.RightOperand.ToString() + ")";
    };
    SubstractOperatorExpression.prototype.Execute = function () {
        if ()
            return this.LeftOperand.Execute() - this.RightOperand.Execute();
    };
    return SubstractOperatorExpression;
}());
exports.SubstractOperatorExpression = SubstractOperatorExpression;
//# sourceMappingURL=SubstractOperatorExpression.js.map
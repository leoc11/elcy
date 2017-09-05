"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression_1 = require("./ValueExpression");
var DivisionExpression = /** @class */ (function () {
    function DivisionExpression(LeftOperand, RightOperand) {
        this.LeftOperand = LeftOperand;
        this.RightOperand = RightOperand;
    }
    DivisionExpression.Create = function (leftOperand, rightOperand) {
        if (leftOperand instanceof ValueExpression_1.ValueExpression && rightOperand instanceof ValueExpression_1.ValueExpression)
            return new ValueExpression_1.ValueExpression(leftOperand.Execute() - rightOperand.Execute(), "(" + leftOperand.ToString() + " - " + rightOperand.ToString() + ")");
        else
            return new DivisionExpression(leftOperand, rightOperand);
    };
    DivisionExpression.prototype.ToString = function () {
        return "(" + this.LeftOperand.ToString + " / " + this.RightOperand.ToString() + ")";
    };
    DivisionExpression.prototype.Execute = function () {
        return this.LeftOperand.Execute() / this.RightOperand.Execute();
    };
    return DivisionExpression;
}());
exports.DivisionExpression = DivisionExpression;
//# sourceMappingURL=DivisionExpression.js.map
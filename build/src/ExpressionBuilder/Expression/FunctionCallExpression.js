"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression_1 = require("./ValueExpression");
var FunctionCallExpression = /** @class */ (function () {
    function FunctionCallExpression(LeftOperand, RightOperand) {
        this.LeftOperand = LeftOperand;
        this.RightOperand = RightOperand;
    }
    FunctionCallExpression.Create = function (leftOperand, rightOperand) {
        if (leftOperand instanceof ValueExpression_1.ValueExpression && rightOperand instanceof ValueExpression_1.ValueExpression)
            return new ValueExpression_1.ValueExpression(leftOperand.Execute() - rightOperand.Execute(), "(" + leftOperand.ToString() + " - " + rightOperand.ToString() + ")");
        else
            return new FunctionCallExpression(leftOperand, rightOperand);
    };
    FunctionCallExpression.prototype.ToString = function () {
        return "(" + this.LeftOperand.ToString + " / " + this.RightOperand.ToString() + ")";
    };
    FunctionCallExpression.prototype.Execute = function () {
        return this.LeftOperand.Execute() / this.RightOperand.Execute();
    };
    return FunctionCallExpression;
}());
exports.FunctionCallExpression = FunctionCallExpression;
//# sourceMappingURL=FunctionCallExpression.js.map
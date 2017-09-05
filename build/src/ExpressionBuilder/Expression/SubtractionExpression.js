"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression_1 = require("./ValueExpression");
var SubtractionExpression = /** @class */ (function () {
    function SubtractionExpression(LeftOperand, RightOperand) {
        this.LeftOperand = LeftOperand;
        this.RightOperand = RightOperand;
    }
    SubtractionExpression.Create = function (leftOperand, rightOperand) {
        if (leftOperand instanceof ValueExpression_1.ValueExpression && rightOperand instanceof ValueExpression_1.ValueExpression)
            return new ValueExpression_1.ValueExpression(leftOperand.Execute() - rightOperand.Execute(), "(" + leftOperand.ToString() + " - " + rightOperand.ToString() + ")");
        else
            return new SubtractionExpression(leftOperand, rightOperand);
    };
    SubtractionExpression.prototype.ToString = function () {
        return "(" + this.LeftOperand.ToString + " - " + this.RightOperand.ToString() + ")";
    };
    SubtractionExpression.prototype.Execute = function () {
        return this.LeftOperand.Execute() - this.RightOperand.Execute();
    };
    return SubtractionExpression;
}());
exports.SubtractionExpression = SubtractionExpression;
//# sourceMappingURL=SubtractionExpression.js.map
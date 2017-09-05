"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression_1 = require("./ValueExpression");
var MemberAccessExpression = /** @class */ (function () {
    function MemberAccessExpression(LeftOperand, RightOperand) {
        this.LeftOperand = LeftOperand;
        this.RightOperand = RightOperand;
    }
    MemberAccessExpression.Create = function (leftOperand, rightOperand) {
        if (leftOperand instanceof ValueExpression_1.ValueExpression && rightOperand instanceof ValueExpression_1.ValueExpression)
            return new ValueExpression_1.ValueExpression(leftOperand.Execute()[rightOperand.Execute()], leftOperand.ToString() + "." + rightOperand.ToString());
        else
            return new MemberAccessExpression(leftOperand, rightOperand);
    };
    MemberAccessExpression.prototype.ToString = function () {
        return this.LeftOperand.ToString() + "." + this.RightOperand.ToString();
    };
    MemberAccessExpression.prototype.Execute = function () {
        return this.LeftOperand.Execute()[this.RightOperand.Execute()];
    };
    return MemberAccessExpression;
}());
exports.MemberAccessExpression = MemberAccessExpression;
//# sourceMappingURL=MemberAccessExpression.js.map
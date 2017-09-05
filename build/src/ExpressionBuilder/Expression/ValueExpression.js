"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression = /** @class */ (function () {
    function ValueExpression(Value, ExpressionString) {
        if (ExpressionString === void 0) { ExpressionString = ""; }
        _this = _super.call(this, "asdasd") || this;
        this.Value = Value;
        this.ExpressionString = ExpressionString;
        this.Type = this.Value.constructor;
        if (this.ExpressionString === "") {
            if (typeof this.Type === "string")
                this.ExpressionString = "'" + this.Value + "'";
            this.ExpressionString = this.Value + "";
        }
    }
    ValueExpression.prototype.ToString = function () {
        return this.ExpressionString;
    };
    ValueExpression.prototype.Execute = function () {
        return this.Value;
    };
    return ValueExpression;
}());
exports.ValueExpression = ValueExpression;
//# sourceMappingURL=ValueExpression.js.map
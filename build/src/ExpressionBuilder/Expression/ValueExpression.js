"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression = /** @class */ (function () {
    function ValueExpression(Value) {
        this.Value = Value;
        this.Type = typeof this.Value;
    }
    ValueExpression.prototype.ToString = function () {
        if (typeof this.Type === "string")
            return "'" + this.Type + "'";
        return this.Type + "";
    };
    ValueExpression.prototype.Execute = function () {
        return this.Value;
    };
    return ValueExpression;
}());
exports.ValueExpression = ValueExpression;
//# sourceMappingURL=ValueExpression.js.map
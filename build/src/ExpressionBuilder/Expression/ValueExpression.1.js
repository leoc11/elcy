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
        throw new Error("Method not implemented.");
    };
    return ValueExpression;
}());
exports.ValueExpression = ValueExpression;
//# sourceMappingURL=ValueExpression.1.js.map
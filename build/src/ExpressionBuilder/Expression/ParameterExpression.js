"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ParameterExpression = /** @class */ (function () {
    function ParameterExpression(ParamName, ctor) {
        this.ParamName = ParamName;
        this.Type = ctor.name;
    }
    ParameterExpression.prototype.ToString = function () {
        if (typeof this.Type === "string")
            return "'" + this.Type + "'";
        return this.Type + "";
    };
    ParameterExpression.prototype.Execute = function () {
        throw new Error("Method not implemented.");
    };
    return ParameterExpression;
}());
exports.ParameterExpression = ParameterExpression;
//# sourceMappingURL=ParameterExpression.js.map
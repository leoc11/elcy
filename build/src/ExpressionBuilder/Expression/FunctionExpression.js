"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FunctionExpression = /** @class */ (function () {
    function FunctionExpression(Params, Body) {
        this.Params = Params;
        this.Body = Body;
    }
    FunctionExpression.prototype.ToString = function () {
        var params = [];
        for (var _i = 0, _a = this.Params; _i < _a.length; _i++) {
            var param = _a[_i];
            params.push(param.ToString());
        }
        return "(" + params.join(", ") + ") => {" + this.Body.ToString() + "}";
    };
    FunctionExpression.prototype.Execute = function () {
        throw new Error("Method not implemented.");
    };
    return FunctionExpression;
}());
exports.FunctionExpression = FunctionExpression;
//# sourceMappingURL=FunctionExpression.js.map
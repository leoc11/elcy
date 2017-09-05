"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ValueExpression_1 = require("./ValueExpression");
var MethodCallExpression = /** @class */ (function () {
    function MethodCallExpression(ObjectOperand, MethodName, Params) {
        this.ObjectOperand = ObjectOperand;
        this.MethodName = MethodName;
        this.Params = Params;
    }
    MethodCallExpression.Create = function (objectOperand, methodName, params) {
        if (objectOperand instanceof ValueExpression_1.ValueExpression && params.every(function (param) { return param instanceof ValueExpression_1.ValueExpression; })) {
            var objectValue = objectOperand.Execute();
            var paramStr = [];
            for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
                var param = params_1[_i];
                paramStr.push(param.ToString());
            }
            return new ValueExpression_1.ValueExpression((objectValue[methodName]).apply(params), objectOperand.ToString() + "." + methodName + "(" + paramStr.join(",") + ")");
        }
        return new MethodCallExpression(objectOperand, methodName, params);
    };
    MethodCallExpression.prototype.ToString = function () {
        var paramStr = [];
        for (var _i = 0, _a = this.Params; _i < _a.length; _i++) {
            var param = _a[_i];
            paramStr.push(param.ToString());
        }
        return this.ObjectOperand.ToString() + "." + this.MethodName + "(" + paramStr.join(",") + ")";
    };
    MethodCallExpression.prototype.Execute = function () {
        var objectValue = this.ObjectOperand.Execute();
        return objectValue[this.MethodName].apply(objectValue, this.Params);
    };
    return MethodCallExpression;
}());
exports.MethodCallExpression = MethodCallExpression;
//# sourceMappingURL=MethodCallExpression.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ParameterExpression = /** @class */ (function () {
    function ParameterExpression(TCtor, Name) {
        this.Name = Name;
        this.Type = TCtor.name;
    }
    ParameterExpression.prototype.ToString = function () {
        return this.Name;
    };
    ParameterExpression.prototype.Execute = function () {
        throw new Error("Method not implemented.");
    };
    return ParameterExpression;
}());
exports.ParameterExpression = ParameterExpression;
//# sourceMappingURL=ParameterExpression.js.map
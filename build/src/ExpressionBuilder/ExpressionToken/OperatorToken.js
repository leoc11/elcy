"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var OperatorToken = /** @class */ (function () {
    function OperatorToken(Remaining, Operator) {
        this.Remaining = Remaining;
        this.Operator = Operator;
    }
    Object.defineProperty(OperatorToken.prototype, "Value", {
        get: function () {
            if (this.Operator)
                return this.Operator.Symbol;
            return undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(OperatorToken.prototype, "Priority", {
        get: function () {
            if (this.Operator)
                return this.Operator.Priority;
            return -1;
        },
        enumerable: true,
        configurable: true
    });
    return OperatorToken;
}());
exports.OperatorToken = OperatorToken;
//# sourceMappingURL=OperatorToken.js.map
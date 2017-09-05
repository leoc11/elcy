"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const assigmentOperatorPriority = 0;
var logicalOperatorPriority = 2;
var comparisonOperatorPriority = 4;
var aritmaticSubAddOperatorPriority = 6;
var aritmaticPowOperatorPriority = 8;
var singleAritmaticOperatorPriority = 9;
var singleLogicalOperatorPriority = 9;
var memberAccessOperatorPriority = 10;
var OperatorExpression = /** @class */ (function () {
    function OperatorExpression(Symbol, Priority) {
        this.Symbol = Symbol;
        this.Priority = Priority;
    }
    return OperatorExpression;
}());
exports.OperatorExpression = OperatorExpression;
exports.AllOperatorExpressions = [
    new OperatorExpression("++", singleAritmaticOperatorPriority),
    new OperatorExpression("--", singleAritmaticOperatorPriority),
    new OperatorExpression("+", aritmaticSubAddOperatorPriority),
    new OperatorExpression("-", aritmaticSubAddOperatorPriority),
    new OperatorExpression("*", aritmaticPowOperatorPriority),
    new OperatorExpression("/", aritmaticPowOperatorPriority),
    new OperatorExpression("%", aritmaticPowOperatorPriority),
    // Comparison
    new OperatorExpression("==", comparisonOperatorPriority),
    new OperatorExpression("===", comparisonOperatorPriority),
    new OperatorExpression("!==", comparisonOperatorPriority),
    new OperatorExpression(">==", comparisonOperatorPriority),
    new OperatorExpression("<==", comparisonOperatorPriority),
    new OperatorExpression("!=", comparisonOperatorPriority),
    new OperatorExpression(">=", comparisonOperatorPriority),
    new OperatorExpression("<=", comparisonOperatorPriority),
    new OperatorExpression("<", comparisonOperatorPriority),
    new OperatorExpression(">", comparisonOperatorPriority),
    new OperatorExpression("?", comparisonOperatorPriority),
    // Logical
    new OperatorExpression("&&", logicalOperatorPriority),
    new OperatorExpression("||", logicalOperatorPriority),
    new OperatorExpression("&", logicalOperatorPriority),
    new OperatorExpression("|", logicalOperatorPriority),
    new OperatorExpression("!", singleLogicalOperatorPriority),
    // Member access
    new OperatorExpression(".", memberAccessOperatorPriority)
];
//# sourceMappingURL=OperatorExpression.js.map
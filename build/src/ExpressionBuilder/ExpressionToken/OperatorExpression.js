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
// + binary operator ~ >> << >>>
var ExpressionOperator = /** @class */ (function () {
    function ExpressionOperator(Symbol, Priority) {
        this.Symbol = Symbol;
        this.Priority = Priority;
    }
    return ExpressionOperator;
}());
exports.ExpressionOperator = ExpressionOperator;
exports.AllExpressionOperators = [
    new ExpressionOperator("++", singleAritmaticOperatorPriority),
    new ExpressionOperator("--", singleAritmaticOperatorPriority),
    new ExpressionOperator("+", aritmaticSubAddOperatorPriority),
    new ExpressionOperator("-", aritmaticSubAddOperatorPriority),
    new ExpressionOperator("*", aritmaticPowOperatorPriority),
    new ExpressionOperator("/", aritmaticPowOperatorPriority),
    new ExpressionOperator("%", aritmaticPowOperatorPriority),
    // Comparison
    new ExpressionOperator("===", comparisonOperatorPriority),
    new ExpressionOperator("!==", comparisonOperatorPriority),
    new ExpressionOperator(">==", comparisonOperatorPriority),
    new ExpressionOperator("<==", comparisonOperatorPriority),
    new ExpressionOperator("==", comparisonOperatorPriority),
    new ExpressionOperator("!=", comparisonOperatorPriority),
    new ExpressionOperator(">=", comparisonOperatorPriority),
    new ExpressionOperator("<=", comparisonOperatorPriority),
    new ExpressionOperator("<", comparisonOperatorPriority),
    new ExpressionOperator(">", comparisonOperatorPriority),
    new ExpressionOperator("?", comparisonOperatorPriority),
    // Logical
    new ExpressionOperator("&&", logicalOperatorPriority),
    new ExpressionOperator("||", logicalOperatorPriority),
    new ExpressionOperator("&", logicalOperatorPriority),
    new ExpressionOperator("|", logicalOperatorPriority),
    new ExpressionOperator("!", singleLogicalOperatorPriority),
    // Member access
    new ExpressionOperator(".", memberAccessOperatorPriority)
];
//# sourceMappingURL=OperatorExpression.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var operators = [
    // Arithmetic 1 operand
    "++",
    "--",
    // Arithmetic
    "+",
    "-",
    "*",
    "/",
    "%",
    // Comparison
    "==",
    "===",
    "!=",
    "!==",
    ">=",
    "<=",
    "<",
    ">",
    "?",
    // Logical
    "&&",
    "||",
    "&",
    "|",
    // Logical 1 operand
    "!",
    // Property and Method
    ".",
    // Assignment
    "=", "+=", "-=", "*=", "/=", "%=",
];
var singleRightOperators = [
    // Arithmetic 1 operand
    "++",
    "--",
];
var singleLeftOperators = [
    // Arithmetic 1 operand
    "++",
    "--",
    // Logical 1 operand
    "!",
];
var ExpressionBuilder = /** @class */ (function () {
    function ExpressionBuilder() {
    }
    /**
     *
     */
    ExpressionBuilder.prototype.Parse = function (expression, startOperand) {
        if (startOperand === void 0) { startOperand = ""; }
        var blockResult = this.ParseBlock(expression, startOperand);
        expression = blockResult[1];
        var parseResult = blockResult[0];
        if (expression) {
            return this.Parse(expression, parseResult);
        }
        return parseResult;
    };
    ExpressionBuilder.prototype.GetOperand = function (expression, excludeGlobalFunction) {
        if (excludeGlobalFunction === void 0) { excludeGlobalFunction = false; }
        expression = this.RemoveComments(expression);
        if (!expression) {
            return ["", ""];
        }
        var operand = "";
        var firstChar = expression[0];
        if (firstChar === "'" || firstChar === '"') {
            var startIndex = 0;
            while (true) {
                startIndex = expression.indexOf(firstChar, startIndex + 1);
                if (expression.charAt(startIndex - 1) !== "\\") {
                    break;
                }
            }
            operand = expression.substring(0, startIndex + 1);
            expression = expression.substring(startIndex + 1).trim();
        }
        else if (firstChar === "(") {
            var blockResult = this.ParseBlock(expression.substring(1), "", ")");
            operand = blockResult[0];
            expression = blockResult[1];
        }
        else {
            var opeatorResult = this.GetOperator(expression, singleLeftOperators);
            if (opeatorResult[0]) {
                var soperator = opeatorResult[0];
                var opResult = this.GetOperand(opeatorResult[1]);
                operand = "eq(undefined, '" + soperator + "', " + opResult[0] + ")";
                expression = opResult[1];
            }
            else {
                var match = expression.match(/^[a-z0-9]+/i);
                if (match) {
                    operand = match[0];
                    expression = expression.substring(operand.length);
                }
            }
        }
        if (expression) {
            if (!excludeGlobalFunction && expression[0] === "(") {
                // is global function call method
                expression = expression.substring(1);
                var param = "[";
                while (true) {
                    var methodParamResult = this.ParseBlock(expression, "", ",)");
                    expression = methodParamResult[1];
                    param += methodParamResult[0];
                    if (methodParamResult[2] === ")") {
                        break;
                    }
                    else {
                        param += ", ";
                    }
                }
                param += "]";
                operand = "Parser.FunctionCall(" + operand + ", " + param + ")";
            }
            else {
                var opeatorResult = this.GetOperator(expression, singleRightOperators);
                var soperator = opeatorResult[0];
                expression = opeatorResult[1];
                if (soperator) {
                    operand = "eq(" + operand + ", '" + soperator + "', undefined)";
                }
            }
        }
        return [operand, expression.trim()];
    };
    ExpressionBuilder.prototype.GetOperator = function (expression, ops) {
        if (ops === void 0) { ops = operators; }
        expression = this.RemoveComments(expression);
        if (!expression) {
            return ["", ""];
        }
        var operator = "";
        if (!Array.isArray(ops)) {
            ops = operators;
        }
        for (var _i = 0, ops_1 = ops; _i < ops_1.length; _i++) {
            var op = ops_1[_i];
            if (expression.indexOf(op) === 0) {
                operator = op;
                break;
            }
        }
        expression = expression.substring(operator.length);
        return [operator, expression.trim()];
    };
    ExpressionBuilder.prototype.ParseBlock = function (expression, startOperand, endCharacter) {
        if (startOperand === void 0) { startOperand = ""; }
        if (endCharacter === void 0) { endCharacter = ""; }
        if (!startOperand) {
            var operandResult = this.GetOperand(expression);
            startOperand = operandResult[0];
            expression = operandResult[1];
        }
        var operator = "";
        if (expression) {
            var operatorResult = this.GetOperator(expression);
            operator = operatorResult[0];
            expression = operatorResult[1];
            if (operator) {
                var lastOperand = "";
                switch (operator) {
                    case "?": {
                        var ternaryResult = this.ParseBlock(expression, "", ":");
                        var trueValue = ternaryResult[0];
                        ternaryResult = this.ParseBlock(ternaryResult[1], "", ":");
                        var falseValue = ternaryResult[0];
                        lastOperand = trueValue + ", " + falseValue;
                        expression = ternaryResult[1];
                        break;
                    }
                    case ".": {
                        var operandResult = this.GetOperand(expression, true);
                        lastOperand = operandResult[0];
                        expression = operandResult[1];
                        if (expression[0] === "(") {
                            // is method
                            expression = expression.substring(1);
                            var param = "[";
                            while (true) {
                                var methodParamResult = this.ParseBlock(expression, "", ",)");
                                expression = methodParamResult[1];
                                param += methodParamResult[0];
                                if (methodParamResult[2] === ")") {
                                    break;
                                }
                                param += ", ";
                            }
                            param += "]";
                            lastOperand += ", " + param;
                        }
                        break;
                    }
                    default: {
                        var operandResult = this.GetOperand(expression);
                        expression = operandResult[1];
                        lastOperand = operandResult[0];
                        break;
                    }
                }
                if (!startOperand) {
                    startOperand = "undefined";
                }
                if (!lastOperand) {
                    lastOperand = "undefined";
                }
                startOperand = "eq(" + startOperand + ", '" + operator + "', " + lastOperand + ")";
            }
        }
        if (expression) {
            if (endCharacter && endCharacter.indexOf(expression[0]) >= 0) {
                endCharacter = expression[0];
                expression = expression.substring(1).trim();
            }
            else if (operator) {
                var blockResult = this.ParseBlock(expression, startOperand, endCharacter);
                startOperand = blockResult[0];
                expression = blockResult[1];
            }
        }
        return [startOperand, expression, endCharacter];
    };
    ExpressionBuilder.prototype.RemoveComments = function (expression) {
        expression = expression.trim();
        if (!expression) {
            return expression;
        }
        if (expression.indexOf("/*") === 0) {
            var lastIndex = expression.indexOf("*/", 2);
            if (lastIndex < 0) {
                lastIndex = expression.length - 2;
            }
            expression = expression.substring(lastIndex + 2);
            expression = this.RemoveComments(expression);
        }
        else if (expression.indexOf("//") === 0) {
            var lastIndex = expression.indexOf("\n", 2);
            if (lastIndex < 0) {
                lastIndex = expression.length - 1;
            }
            expression = expression.substring(lastIndex + 1);
            expression = this.RemoveComments(expression);
        }
        return expression;
    };
    return ExpressionBuilder;
}());
exports.ExpressionBuilder = ExpressionBuilder;
//# sourceMappingURL=ExpressionBuilder.1.js.map
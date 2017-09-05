"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./ExpressionToken/");
/**
 * for parsing function into expression convertable to sql query
 */
var ExpressionBuilder2 = /** @class */ (function () {
    function ExpressionBuilder2() {
    }
    ExpressionBuilder2.prototype.Parse = function (expression) {
        var blockResult = this.GetBlock(expression);
        expression = this.RemoveComments(blockResult.Remaining);
        if (expression)
            throw new Error("Has not parsed string.\n\tRemaining: " + expression +
                "\n\tResult: " + JSON.stringify(blockResult));
        return blockResult.Value;
    };
    ExpressionBuilder2.prototype.GetBlock = function (expressionStr, expressionResult, prevOperators) {
        if (expressionResult === void 0) { expressionResult = ""; }
        if (prevOperators === void 0) { prevOperators = []; }
        var prevOperator = prevOperators[0];
        var operandToken = this.GetOperand(expressionStr, prevOperator);
        expressionStr = this.RemoveComments(operandToken.Remaining);
        var closeString = "";
        var isOperandOnly = !expressionStr;
        if (!isOperandOnly) {
            var operatorToken = this.GetOperator(operandToken.Remaining);
            if (operatorToken.Value) {
                expressionStr = operatorToken.Remaining;
                var isUseNextOperator = !prevOperator || operatorToken.Priority > prevOperator.Priority;
                if (isUseNextOperator) {
                    expressionResult += "eq(" + operandToken.Value + ", '" + operatorToken.Value + "', ";
                }
                else {
                    var closing = "";
                    do {
                        prevOperator = prevOperators.shift();
                        if (!prevOperator)
                            break;
                        closing += ")";
                    } while (prevOperator && operatorToken.Priority < prevOperator.Priority);
                    expressionResult = "eq(" + (expressionResult + operandToken.Value + closing) +
                        ", '" + operatorToken.Value + "', ";
                }
                prevOperators.unshift(operatorToken);
                expressionStr = this.RemoveComments(expressionStr);
                if (!expressionStr)
                    throw new Error("Script not valid: missing operand\n\tResult: " + expressionResult +
                        "\n\tRemaining: " + expressionStr);
                var blockResult = this.GetBlock(expressionStr, expressionResult, prevOperators);
                expressionResult = blockResult.Value;
                expressionStr = this.RemoveComments(blockResult.Remaining);
                return new _1.BlockToken(expressionResult, expressionStr, blockResult.CloseString);
            }
            expressionStr = this.RemoveComments(operatorToken.Remaining);
        }
        expressionResult += operandToken.Value;
        if (!isOperandOnly) {
            if (expressionStr) {
                closeString = expressionStr[0];
                expressionStr = expressionStr.substring(1);
            }
        }
        for (var _i = 0, prevOperators_1 = prevOperators; _i < prevOperators_1.length; _i++) {
            var _a = prevOperators_1[_i];
            expressionResult += ")";
        }
        return new _1.BlockToken(expressionResult, expressionStr, closeString);
    };
    ExpressionBuilder2.prototype.GetOperand = function (expressionStr, prevOperator) {
        expressionStr = this.RemoveComments(expressionStr);
        if (!expressionStr)
            return new _1.OperandToken("", "");
        var operand;
        if (prevOperator && prevOperator.Value === "?") {
            var blockResult = this.GetBlock(expressionStr);
            if (blockResult.CloseString !== ":")
                throw new Error("ternary true value must be closed with ':'\n\tOrigin: " + expressionStr +
                    "\n\tBlockResult: " + JSON.stringify(blockResult));
            var trueOperand = blockResult.Value;
            blockResult = this.GetBlock(blockResult.Remaining);
            var falseOperand = blockResult.Value;
            operand = trueOperand + ", " + falseOperand;
            return new _1.OperandToken(operand, blockResult.CloseString + blockResult.Remaining);
        }
        var firstChar = expressionStr[0];
        switch (firstChar) {
            case "'":
            case "\"":
                var startIndex = 0;
                while (true) {
                    startIndex = expressionStr.indexOf(firstChar, startIndex + 1);
                    if (expressionStr.charAt(startIndex - 1) !== "\\") {
                        break;
                    }
                }
                operand = expressionStr.substring(0, startIndex + 1);
                expressionStr = expressionStr.substring(startIndex + 1).trim();
                break;
            case "(":
                var blockResult = this.GetBlock(expressionStr.substring(1), "");
                if (blockResult.CloseString !== ")")
                    throw Error("Block not closed correctly.\n\tInput" + expressionStr + "\n\tResult: " + JSON.stringify(blockResult));
                operand = blockResult.Value;
                expressionStr = blockResult.Remaining;
                break;
            case "[":
                expressionStr = expressionStr.substring(1);
                operand = "([";
                while (true) {
                    var methodParamResult = this.GetBlock(expressionStr, "");
                    operand += methodParamResult.Value;
                    expressionStr = methodParamResult.Remaining;
                    if (methodParamResult.CloseString === "]")
                        break;
                    operand += ", ";
                }
                operand += "])";
                break;
            default:
                var match = expressionStr.match(/^[a-z0-9]+/i);
                if (match) {
                    operand = match[0];
                    expressionStr = expressionStr.substring(operand.length);
                }
                break;
        }
        if (prevOperator && prevOperator.Value === ".")
            operand = "'" + operand + "'";
        expressionStr = this.RemoveComments(expressionStr);
        if (expressionStr && expressionStr[0] === "(") {
            // is global function call method
            expressionStr = expressionStr.substring(1);
            var param = "[";
            while (true) {
                var methodParamResult = this.GetBlock(expressionStr, "");
                param += methodParamResult.Value;
                expressionStr = methodParamResult.Remaining;
                if (methodParamResult.CloseString !== ")")
                    param += ", ";
                else
                    break;
            }
            param += "]";
            if (prevOperator && prevOperator.Value === ".")
                operand += ", " + param;
            else
                operand = "Parser.FunctionCall('" + operand + "', " + param + ")";
        }
        return new _1.OperandToken(operand, expressionStr);
    };
    ExpressionBuilder2.prototype.GetOperator = function (expression) {
        expression = this.RemoveComments(expression);
        if (!expression)
            return new _1.OperatorToken(expression);
        var operator;
        for (var _i = 0, AllOperatorExpressions_1 = _1.AllOperatorExpressions; _i < AllOperatorExpressions_1.length; _i++) {
            var operatorExp = AllOperatorExpressions_1[_i];
            if (expression.indexOf(operatorExp.Symbol) === 0) {
                operator = operatorExp;
                break;
            }
        }
        if (operator) {
            expression = expression.substring(operator.Symbol.length);
            return new _1.OperatorToken(expression.trim(), operator);
        }
        return new _1.OperatorToken(expression);
    };
    ExpressionBuilder2.prototype.RemoveComments = function (expression) {
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
    return ExpressionBuilder2;
}());
exports.ExpressionBuilder2 = ExpressionBuilder2;
//# sourceMappingURL=ExpressionBuilder2.js.map
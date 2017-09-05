"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./Expression/");
var _2 = require("./ExpressionToken/");
var ExpressionParser = /** @class */ (function () {
    function ExpressionParser() {
    }
    return ExpressionParser;
}());
exports.ExpressionParser = ExpressionParser;
// tslint:disable-next-line:max-classes-per-file
var ExpressionFactory = /** @class */ (function () {
    function ExpressionFactory() {
    }
    return ExpressionFactory;
}());
exports.ExpressionFactory = ExpressionFactory;
/**
 * for parsing function into expression convertable to sql query
 */
// tslint:disable-next-line:max-classes-per-file
var ExpressionBuilder = /** @class */ (function () {
    function ExpressionBuilder() {
    }
    ExpressionBuilder.prototype.Parse = function (expression) {
        var blockResult = this.GetBlock(expression);
        if (!blockResult)
            return null;
        expression = this.RemoveComments(blockResult.Remaining);
        if (expression)
            throw new Error("Has not parsed string.\n\tRemaining: " + expression +
                "\n\tResult: " + JSON.stringify(blockResult));
        return blockResult.Value;
    };
    ExpressionBuilder.prototype.Parse2 = function (expression) {
        var blockResult = this.GetBlock(expression);
        if (!blockResult)
            return null;
        expression = this.RemoveComments(blockResult.Remaining);
        if (expression)
            throw new Error("Has not parsed string.\n\tRemaining: " + expression +
                "\n\tResult: " + JSON.stringify(blockResult));
        return blockResult.Value;
    };
    // public ParseToExpression<T>(parser: ExpressionParser, fn: (...params: any[]) => any, params: any[]) {
    //     const fnParams = this.GetFunctionParams(fn);
    //     const paramObject: { [key: string]: any } = {};
    //     if (params.length > fnParams.length)
    //         throw new Error("Paramater length mismatch");
    //     for (let i = 0; i < params.length; i++) {
    //         paramObject[fnParams[i]] = params[i];
    //     }
    //     const fnBody = this.GetFunctionBody(fn);
    //     const expressionBody = this.Parse2(fnBody);
    //     const expressionVisitor = new Function(fnParams + ", Parser", expressionBody);
    //     params.push(parser);
    //     return (o: T) => {
    //         params.unshift(o);
    //         return expressionVisitor.apply(this, params);
    //     };
    // }
    /**
     * GetFunctionParams
     */
    ExpressionBuilder.prototype.GetFunctionParams = function (fn) {
        var functionStr = fn.toString();
        var paramOpenIndex = functionStr.indexOf("(");
        var paramCloseIndex = functionStr.indexOf(")");
        return functionStr.substring(paramOpenIndex + 1, paramCloseIndex).split(",");
    };
    ExpressionBuilder.prototype.GetFunctionBody = function (fn) {
        var functionStr = fn.toString();
        var arrowIndex = functionStr.indexOf("=>");
        var fnOpenIndex = functionStr.indexOf("{");
        if (fnOpenIndex > arrowIndex) {
            var fnCloseIndex = functionStr.indexOf("}");
            return functionStr.substring(fnOpenIndex, fnCloseIndex).trim();
        }
        // for arrow function (o)=> '123'
        return "return " + functionStr.substring(arrowIndex + 1).trim();
    };
    ExpressionBuilder.prototype.GetOperatorExpression = function (operator) {
        if (operator === void 0) { operator = ""; }
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (operator !== "")
            return _1.SubtractionExpression.Create(params[0], params[1]);
        return _1.SubtractionExpression.Create(params[1], params[0]);
    };
    ExpressionBuilder.prototype.GetBlock = function (expressionStr, expressionResult, prevOperators) {
        if (prevOperators === void 0) { prevOperators = []; }
        var prevOperator = prevOperators[0];
        var operandToken = this.GetOperand(expressionStr, prevOperator);
        if (operandToken == null)
            return null;
        expressionStr = this.RemoveComments(operandToken.Remaining);
        // let closeString = "";
        var isOperandOnly = !expressionStr;
        if (!expressionResult)
            expressionResult = operandToken.Value;
        if (!isOperandOnly && typeof expressionResult !== "undefined") {
            var operatorToken = this.GetOperator(operandToken.Remaining);
            if (operatorToken.Value) {
                expressionStr = operatorToken.Remaining;
                var isUseNextOperator = !prevOperator || operatorToken.Priority > prevOperator.Priority;
                if (isUseNextOperator) {
                    var blockResult = this.GetBlock(expressionStr, operandToken.Value, prevOperators);
                    if (blockResult) {
                        expressionResult = this.GetOperatorExpression("", expressionResult, blockResult.Value);
                        expressionStr = this.RemoveComments(blockResult.Remaining);
                    }
                    // expressionResult += "eq(" + operandToken.Value + ", '" + operatorToken.Value + "', ";
                }
                else {
                    if (operandToken.Value)
                        expressionResult = this.GetOperatorExpression(prevOperator.Value, expressionResult, operandToken.Value);
                    // let closing = "";
                    // do {
                    //     prevOperator = prevOperators.shift();
                    //     if (!prevOperator)
                    //         break;
                    //     closing += ")";
                    // } while (prevOperator && operatorToken.Priority < prevOperator.Priority);
                    // const result = this.GetBlock(expressionStr, expressionResult, prevOperators);
                    // expressionResult = "eq(" + (expressionResult + operandToken.Value + closing) +
                    //    ", '" + operatorToken.Value + "', ";
                }
                // prevOperators.unshift(operatorToken);
                // expressionStr = this.RemoveComments(expressionStr);
                // if (!expressionStr)
                //     throw new Error("Script not valid: missing operand\n\tResult: " + expressionResult +
                //         "\n\tRemaining: " + expressionStr);
                // const blockResult = this.GetBlock(expressionStr, expressionResult, prevOperators);
                // expressionResult = blockResult.Value;
                // expressionStr = this.RemoveComments(blockResult.Remaining);
                if (expressionResult)
                    return new _2.BlockToken(expressionResult, expressionStr, "");
            }
            expressionStr = this.RemoveComments(operatorToken.Remaining);
        }
        // expressionResult += operandToken.Value;
        // if (!isOperandOnly) {
        //     if (expressionStr) {
        //         closeString = expressionStr[0];
        //         expressionStr = expressionStr.substring(1);
        //     }
        // }
        // for (const { } of prevOperators) {
        //     expressionResult += ")";
        // }
        if (expressionResult)
            return new _2.BlockToken(expressionResult, expressionStr, "");
        return null;
    };
    ExpressionBuilder.prototype.GetOperand = function (expressionStr, prevOperator) {
        expressionStr = this.RemoveComments(expressionStr);
        if (!expressionStr && prevOperator)
            return null;
        var operand;
        // if (prevOperator && prevOperator.Value === "?") {
        //     let blockResult = this.GetBlock(expressionStr);
        //     if (blockResult.CloseString !== ":")
        //         throw new Error("ternary true value must be closed with ':'\n\tOrigin: " + expressionStr +
        //             "\n\tBlockResult: " + JSON.stringify(blockResult));
        //     const trueOperand = blockResult.Value;
        //     blockResult = this.GetBlock(blockResult.Remaining);
        //     const falseOperand = blockResult.Value;
        //     operand = trueOperand + ", " + falseOperand;
        //     return new OperandToken(operand, blockResult.CloseString + blockResult.Remaining);
        // }
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
                operand = new _1.ValueExpression(expressionStr.substring(0, startIndex + 1));
                expressionStr = expressionStr.substring(startIndex + 1).trim();
                break;
            // case "(":
            //     const blockResult = this.GetBlock(expressionStr.substring(1), "");
            //     if (blockResult.CloseString !== ")")
            //         throw Error("Block not closed correctly.\n\tInput" + expressionStr + "\n\tResult: " + JSON.stringify(blockResult));
            //     operand = blockResult.Value;
            //     expressionStr = blockResult.Remaining;
            //     break;
            // case "[":
            //     expressionStr = expressionStr.substring(1);
            //     operand = "([";
            //     while (true) {
            //         const methodParamResult = this.GetBlock(expressionStr, "");
            //         operand += methodParamResult.Value;
            //         expressionStr = methodParamResult.Remaining;
            //         if (methodParamResult.CloseString === "]")
            //             break;
            //         operand += ", ";
            //     }
            //     operand += "])";
            //     break;
            default:
                var match = expressionStr.match(/^[a-z0-9]+/i);
                if (match !== null) {
                    // to do check type.
                    var intValue = parseFloat(match[0]);
                    if (!isNaN(intValue))
                        operand = new _1.ValueExpression(intValue);
                    else
                        operand = new _1.ValueExpression(match[0]);
                    expressionStr = expressionStr.substring(match[0].length);
                }
                break;
        }
        // if (prevOperator && prevOperator.Value === ".")
        //     operand = "'" + operand + "'";
        expressionStr = this.RemoveComments(expressionStr);
        if (expressionStr && expressionStr[0] === "(") {
            // is global function call method
            // expressionStr = expressionStr.substring(1);
            // let param = "[";
            // while (true) {
            //     const methodParamResult = this.GetBlock(expressionStr, "");
            //     param += methodParamResult.Value;
            //     expressionStr = methodParamResult.Remaining;
            //     if (methodParamResult.CloseString !== ")")
            //         param += ", ";
            //     else
            //         break;
            // }
            // param += "]";
            // if (prevOperator && prevOperator.Value === ".")
            //     operand += ", " + param;
            // else
            //     operand = "Parser.FunctionCall('" + operand + "', " + param + ")";
        }
        return new _2.OperandToken(operand, expressionStr);
    };
    ExpressionBuilder.prototype.GetOperator = function (expression) {
        expression = this.RemoveComments(expression);
        if (!expression)
            return new _2.OperatorToken(expression);
        var operator;
        for (var _i = 0, AllExpressionOperators_1 = _2.AllExpressionOperators; _i < AllExpressionOperators_1.length; _i++) {
            var operatorExp = AllExpressionOperators_1[_i];
            if (expression.indexOf(operatorExp.Symbol) === 0) {
                operator = operatorExp;
                break;
            }
        }
        if (operator) {
            expression = expression.substring(operator.Symbol.length);
            return new _2.OperatorToken(expression.trim(), operator);
        }
        return new _2.OperatorToken(expression);
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
//# sourceMappingURL=ExpressionBuilder.js.map
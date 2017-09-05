import {
    AllOperatorExpressions,
    BlockToken,
    OperandToken,
    OperatorExpression,
    OperatorToken
} from "./ExpressionToken/";


export class ExpressionParser {

}
// tslint:disable-next-line:max-classes-per-file
export class ExpressionFactory {

}
/**
 * for parsing function into expression convertable to sql query
 */
// tslint:disable-next-line:max-classes-per-file
export class ExpressionBuilder {
    public Parse(expression: string): string {
        const blockResult = this.GetBlock(expression);
        expression = this.RemoveComments(blockResult.Remaining);
        if (expression)
            throw new Error("Has not parsed string.\n\tRemaining: " + expression +
                "\n\tResult: " + JSON.stringify(blockResult));

        return blockResult.Value;
    }

    public ParseToExpression<T>(parser: ExpressionParser, fn: (...params: any[]) => any, params: any[]) {
        const fnParams = this.GetFunctionBody(fn);
        const fnBody = this.GetFunctionBody(fn);
        const expressionBody = this.Parse(fnBody);

        const expressionVisitor = new Function(fnParams + ", Parser", expressionBody);
        params.push(parser);
        return (o: T) => {
            params.unshift(o);
            return expressionVisitor.apply(this, params);
        };
    }

    /**
     * GetFunctionParams
     */
    public GetFunctionParams(fn: (...params: any[]) => any) {
        const functionStr = fn.toString();
        const paramOpenIndex = functionStr.indexOf("(");
        const paramCloseIndex = functionStr.indexOf(")");
        return functionStr.substring(paramOpenIndex + 1, paramCloseIndex);
    }

    public GetFunctionBody(fn: (...params: any[]) => any) {
        const functionStr = fn.toString();
        const arrowIndex = functionStr.indexOf("=>");
        const fnOpenIndex = functionStr.indexOf("{");
        if (fnOpenIndex > arrowIndex) {
            const fnCloseIndex = functionStr.indexOf("}");
            return functionStr.substring(fnOpenIndex, fnCloseIndex).trim();
        }
        // for arrow function (o)=> '123'
        return "return " + functionStr.substring(arrowIndex + 1).trim();
    }

    protected GetBlock(expressionStr: string, expressionResult: string = "", prevOperators: OperatorToken[] = []): BlockToken {
        let prevOperator: OperatorToken | undefined = prevOperators[0];
        const operandToken = this.GetOperand(expressionStr, prevOperator);
        expressionStr = this.RemoveComments(operandToken.Remaining);
        let closeString = "";
        const isOperandOnly = !expressionStr;

        if (!isOperandOnly) {
            const operatorToken = this.GetOperator(operandToken.Remaining);
            if (operatorToken.Value) {
                expressionStr = operatorToken.Remaining;
                const isUseNextOperator = !prevOperator || operatorToken.Priority > prevOperator.Priority;
                if (isUseNextOperator) {
                    expressionResult += "eq(" + operandToken.Value + ", '" + operatorToken.Value + "', ";
                }
                else {
                    let closing = "";
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

                const blockResult = this.GetBlock(expressionStr, expressionResult, prevOperators);
                expressionResult = blockResult.Value;
                expressionStr = this.RemoveComments(blockResult.Remaining);
                return new BlockToken(expressionResult, expressionStr, blockResult.CloseString);
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

        for (const { } of prevOperators) {
            expressionResult += ")";
        }

        return new BlockToken(expressionResult, expressionStr, closeString);
    }

    protected GetOperand(expressionStr: string, prevOperator?: OperatorToken): OperandToken {
        expressionStr = this.RemoveComments(expressionStr);

        if (!expressionStr)
            return new OperandToken("", "");

        let operand: string | undefined;

        if (prevOperator && prevOperator.Value === "?") {
            let blockResult = this.GetBlock(expressionStr);
            if (blockResult.CloseString !== ":")
                throw new Error("ternary true value must be closed with ':'\n\tOrigin: " + expressionStr +
                    "\n\tBlockResult: " + JSON.stringify(blockResult));
            const trueOperand = blockResult.Value;
            blockResult = this.GetBlock(blockResult.Remaining);
            const falseOperand = blockResult.Value;
            operand = trueOperand + ", " + falseOperand;
            return new OperandToken(operand, blockResult.CloseString + blockResult.Remaining);
        }

        const firstChar = expressionStr[0];
        switch (firstChar) {
            case "'":
            case "\"":
                let startIndex = 0;
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
                const blockResult = this.GetBlock(expressionStr.substring(1), "");
                if (blockResult.CloseString !== ")")
                    throw Error("Block not closed correctly.\n\tInput" + expressionStr + "\n\tResult: " + JSON.stringify(blockResult));

                operand = blockResult.Value;
                expressionStr = blockResult.Remaining;
                break;
            case "[":
                expressionStr = expressionStr.substring(1);
                operand = "([";
                while (true) {
                    const methodParamResult = this.GetBlock(expressionStr, "");
                    operand += methodParamResult.Value;
                    expressionStr = methodParamResult.Remaining;
                    if (methodParamResult.CloseString === "]")
                        break;

                    operand += ", ";
                }
                operand += "])";
                break;
            default:
                const match = expressionStr.match(/^[a-z0-9]+/i);
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
            let param = "[";
            while (true) {
                const methodParamResult = this.GetBlock(expressionStr, "");
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

        return new OperandToken(operand, expressionStr);
    }

    protected GetOperator(expression: string): OperatorToken {
        expression = this.RemoveComments(expression);
        if (!expression)
            return new OperatorToken(expression);

        let operator: OperatorExpression | undefined;
        for (const operatorExp of AllOperatorExpressions) {
            if (expression.indexOf(operatorExp.Symbol) === 0) {
                operator = operatorExp;
                break;
            }
        }

        if (operator) {
            expression = expression.substring(operator.Symbol.length);
            return new OperatorToken(expression.trim(), operator);
        }

        return new OperatorToken(expression);
    }

    protected RemoveComments(expression: string) {
        expression = expression.trim();
        if (!expression) {
            return expression;
        }

        if (expression.indexOf("/*") === 0) {
            let lastIndex = expression.indexOf("*/", 2);
            if (lastIndex < 0) {
                lastIndex = expression.length - 2;
            }

            expression = expression.substring(lastIndex + 2);
            expression = this.RemoveComments(expression);
        } else if (expression.indexOf("//") === 0) {
            let lastIndex = expression.indexOf("\n", 2);
            if (lastIndex < 0) {
                lastIndex = expression.length - 1;
            }

            expression = expression.substring(lastIndex + 1);
            expression = this.RemoveComments(expression);
        }

        return expression;
    }
}

import {
    IExpression,
    SubtractionExpression,
    ValueExpression
} from "./Expression/";
import {
    AllExpressionOperators,
    BlockToken,
    ExpressionOperator,
    OperandToken,
    OperatorToken
} from "./ExpressionToken/";

export class ExpressionBuilder {
    public Parse(expression: string) {
        const blockResult = this.GetBlock(expression);
        if (!blockResult)
            return null;
        expression = this.RemoveComments(blockResult.Remaining);
        if (expression)
            throw new Error("Has not parsed string.\n\tRemaining: " + expression +
                "\n\tResult: " + JSON.stringify(blockResult));

        return blockResult.Value;
    }
    public Parse2(expression: string) {
        const blockResult = this.GetBlock(expression);
        if (!blockResult)
            return null;

        expression = this.RemoveComments(blockResult.Remaining);
        if (expression)
            throw new Error("Has not parsed string.\n\tRemaining: " + expression +
                "\n\tResult: " + JSON.stringify(blockResult));

        return blockResult.Value;
    }

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
    public GetFunctionParams(fn: (...params: any[]) => any) {
        const functionStr = fn.toString();
        const paramOpenIndex = functionStr.indexOf("(");
        const paramCloseIndex = functionStr.indexOf(")");
        return functionStr.substring(paramOpenIndex + 1, paramCloseIndex).split(",");
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

    protected GetOperatorExpression(operator: string = "", ...params: IExpression[]) {
        if (operator !== "")
            return SubtractionExpression.Create(params[0], params[1]);
        return SubtractionExpression.Create(params[1], params[0]);
    }

    protected GetBlock(expressionStr: string, expressionResult?: IExpression, prevOperators: OperatorToken[] = []): BlockToken | null {
        let prevOperator: OperatorToken | undefined = prevOperators[0];
        const operandToken = this.GetOperand(expressionStr, prevOperator);

        if (operandToken == null)
            return null;

        expressionStr = this.RemoveComments(operandToken.Remaining);
        let closeString = "";
        const isOperandOnly = !expressionStr;
        if (!expressionResult)
            expressionResult = operandToken.Value;

        if (!isOperandOnly && typeof expressionResult !== "undefined") {
            const operatorToken = this.GetOperator(operandToken.Remaining);
            if (operatorToken.Value) {
                expressionStr = operatorToken.Remaining;
                const isUseNextOperator = !prevOperator || operatorToken.Priority > prevOperator.Priority;
                if (isUseNextOperator) {
                    const blockResult = this.GetBlock(expressionStr, operandToken.Value, prevOperators);
                    if (blockResult) {
                        expressionResult = this.GetOperatorExpression("", expressionResult, blockResult.Value);
                        expressionStr = blockResult.Remaining;
                    }
                    // expressionResult += "eq(" + operandToken.Value + ", '" + operatorToken.Value + "', ";
                }
                else {
                    // let closing = "";
                    do {
                        prevOperator = prevOperators.shift();
                        if (!prevOperator)
                            break;

                        // closing += ")";
                    } while (prevOperator && operatorToken.Priority < prevOperator.Priority);
                    // const result = this.GetBlock(expressionStr, expressionResult, prevOperators);
                    // expressionResult = "eq(" + (expressionResult + operandToken.Value + closing) +
                    //    ", '" + operatorToken.Value + "', ";
                    if (operandToken.Value)
                        expressionResult = this.GetOperatorExpression("", expressionResult, operandToken.Value);
                }

                prevOperators.unshift(operatorToken);
                expressionStr = this.RemoveComments(expressionStr);
                if (!expressionStr)
                    throw new Error("Script not valid: missing operand\n\tResult: " + expressionResult.ToString() +
                        "\n\tRemaining: " + expressionStr);

                // const blockResult = this.GetBlock(expressionStr, expressionResult, prevOperators);
                // expressionResult = blockResult.Value;
                // expressionStr = this.RemoveComments(blockResult.Remaining);
                if (expressionResult)
                    return new BlockToken(expressionResult, expressionStr, "");
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
            return new BlockToken(expressionResult, expressionStr, "");
        return null;
    }

    protected GetOperand(expressionStr: string, prevOperator?: OperatorToken): OperandToken | null {
        expressionStr = this.RemoveComments(expressionStr);

        if (!expressionStr && prevOperator)
            return null;

        let operand: IExpression | undefined;

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
                operand = new ValueExpression(expressionStr.substring(0, startIndex + 1));
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
                const match = expressionStr.match(/^[a-z0-9]+/i);
                if (match !== null) {
                    // to do check type.
                    const intValue = parseFloat(match[0]);
                    if (!isNaN(intValue))
                        operand = new ValueExpression(intValue);
                    else
                        operand = new ValueExpression(match[0]);

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

        return new OperandToken(operand, expressionStr);
    }

    protected GetOperator(expression: string): OperatorToken {
        expression = this.RemoveComments(expression);
        if (!expression)
            return new OperatorToken(expression);

        let operator: ExpressionOperator | undefined;
        for (const operatorExp of AllExpressionOperators) {
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

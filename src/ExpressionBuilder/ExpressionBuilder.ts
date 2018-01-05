import { genericType } from "../Common/Type";
import * as Expression from "./Expression/";
import { IExpression } from "./Expression/";
import {
    BinaryOperators,
    BlockToken,
    ExpressionOperator,
    MemberOperators,
    OperandToken,
    OperatorToken,
    RightUnaryOperators,
    TernaryOperators,
    UnaryOperators
} from "./ExpressionToken/";

const GlobalObjects: { [key: string]: any } = global || window;
export class ExpressionBuilder {
    public Parse(expressionStr: string, paramContext?: { [key: string]: any }) {
        expressionStr = this.RemoveComments(expressionStr);
        const blockResult = this.GetBlock(expressionStr, undefined, undefined, paramContext);
        if (!blockResult)
            return null;
        expressionStr = blockResult.Remaining;
        if (expressionStr)
            throw new Error("Has not parsed string.\n\tRemaining: " + expressionStr +
                "\n\tResult: " + JSON.stringify(blockResult));

        return blockResult.Value as IExpression;
    }

    public ParseToExpression(fn: string, cTor: Array<genericType<any>>, params?: any[]): Expression.FunctionExpression;
    public ParseToExpression(fn: string | ((...params: any[]) => any), ctors: Array<genericType<any>>, params?: any[]) {
        if (typeof fn === "function")
            fn = fn.toString();

        const fnParams = this.GetFunctionParams(fn);
        const paramObject: { [key: string]: any } = {};

        const fnParamExpressions: Expression.ParameterExpression[] = [];
        for (let i = 0; i < ctors.length; i++) {
            fnParamExpressions.push(Expression.ParameterExpression.Create(ctors[i], fnParams[i]));
        }

        if (params) {
            if (params.length > fnParams.length - ctors.length)
                throw new Error("Paramater length mismatch");

            for (let i = 0; i < params.length; i++) {
                paramObject[fnParams[i]] = params[i];
            }
        }

        const fnBody = this.GetFunctionBody(fn);
        const expressionBody = this.Parse(fnBody, paramObject);
        if (expressionBody == null)
            return null;

        return new Expression.FunctionExpression(expressionBody, fnParamExpressions);
    }

    /**
     * GetFunctionParams
     */
    public GetFunctionParams(functionStr: string) {
        const paramOpenIndex = functionStr.indexOf("(");
        if (paramOpenIndex >= 0) {
            const paramCloseIndex = functionStr.indexOf(")");
            functionStr = functionStr.substring(paramOpenIndex + 1, paramCloseIndex);
        }
        return functionStr.split(",");
    }

    public GetFunctionBody(functionStr: string) {
        const arrowIndex = functionStr.indexOf("=>");
        const fnOpenIndex = functionStr.indexOf("{");
        if (fnOpenIndex > arrowIndex) {
            const fnCloseIndex = functionStr.indexOf("}");
            return functionStr.substring(fnOpenIndex, fnCloseIndex).trim();
        }
        // for arrow function (o)=> '123'
        return functionStr.substring(arrowIndex + 1).trim();
    }

    protected GetOperatorExpression(operator: string = "", ...params: Array<IExpression | undefined>): IExpression {
        switch (operator as string) {
            case "*":
                return Expression.TimesExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "+":
                if (!params[0])
                    params[0] = Expression.ValueExpression.Create(0);
                return Expression.AdditionExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "-":
                if (!params[0])
                    params[0] = Expression.ValueExpression.Create(0);
                return Expression.SubtractionExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "/":
                return Expression.DivisionExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "++":
                if (!params[0])
                    return Expression.LeftIncrementExpression.Create(params[1] as IExpression);
                else
                    return Expression.RightIncrementExpression.Create(params[0] as IExpression);
            case "--":
                if (!params[0])
                    return Expression.LeftDecrementExpression.Create(params[1] as IExpression);
                else
                    return Expression.RightDecrementExpression.Create(params[0] as IExpression);
            case "&&":
                return Expression.AndExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "!=":
                return Expression.NotEqualExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "!==":
                return Expression.StrictNotEqualExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "==":
                return Expression.EqualExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "===":
                return Expression.StrictEqualExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case ">":
                return Expression.GreaterThanExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case ">=":
                return Expression.GreaterEqualExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "<":
                return Expression.LessThanExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "<=":
                return Expression.LessEqualExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "||":
                return Expression.OrExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "!":
                return Expression.NotExpression.Create(params[1] as IExpression);
            case "&":
                return Expression.BitwiseAndExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "|":
                return Expression.BitwiseOrExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "~":
                return Expression.BitwiseNotExpression.Create(params[1] as IExpression);
            case "^":
                return Expression.BitwiseXorExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "<<":
                return Expression.BitwiseZeroLeftShiftExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case ">>":
                return Expression.BitwiseZeroRightShiftExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case ">>>":
                return Expression.BitwiseSignedRightShiftExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case ">>>":
                return Expression.BitwiseOrExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case ".":
                return Expression.MemberAccessExpression.Create(params[0] as IExpression, params[1] as IExpression);
            case "typeof":
                return Expression.TypeofExpression.Create(params[1] as IExpression);
            case "instanceof":
                return Expression.InstanceofExpression.Create(params[0] as IExpression, params[1] as IExpression);
        }

        throw new Error("(" + operator + ") Operator not supported");
    }

    protected GetBlock(expressionStr: string, expressionResult?: IExpression, prevOperators: OperatorToken[] = [], paramContext?: { [key: string]: any }): BlockToken | null {
        let prevOperator: OperatorToken | undefined = prevOperators[0];
        const operandToken = this.GetOperand(expressionStr, prevOperator, paramContext);
        let closeString = "";
        let operand;
        if (operandToken !== null) {
            expressionStr = operandToken.Remaining;
            operand = operandToken.Value;
        }
        let operatorToken: OperatorToken | null = null;

        if (expressionStr) {
            operatorToken = this.GetOperator(expressionStr);
            // binary operator
            if (operatorToken != null) {
                expressionStr = operatorToken.Remaining;
                const isUseNextOperator = !prevOperator || operatorToken.Priority > prevOperator.Priority;

                if (isUseNextOperator) {
                    prevOperators.unshift(operatorToken);
                    const nextOperandResult = this.GetBlock(expressionStr, operand, prevOperators, paramContext);
                    if (nextOperandResult == null) {
                        throw new Error("Function not valid");
                    }
                    expressionStr = nextOperandResult.Remaining;

                    if (prevOperator) {
                        expressionResult = this.GetOperatorExpression(prevOperator.Value, expressionResult, nextOperandResult.Value);
                        operatorToken = prevOperators[0] as OperatorToken;
                        const index = prevOperators.indexOf(prevOperator);
                        prevOperators.splice(index, 1);
                    }
                    else {
                        expressionResult = nextOperandResult.Value;
                        return new BlockToken(expressionResult, expressionStr, nextOperandResult.CloseString);
                    }
                }
                else {
                    expressionResult = this.GetOperatorExpression(prevOperator.Value, expressionResult, operand);
                    prevOperator = prevOperators.shift();
                    prevOperators.unshift(operatorToken);
                    if (prevOperators.length > 1 && prevOperator && prevOperator.Priority > operatorToken.Priority)
                        return new BlockToken(expressionResult, expressionStr, "");
                }

                if (expressionStr) {
                    const blockResult = this.GetBlock(expressionStr, expressionResult, prevOperators, paramContext) as BlockToken;
                    expressionResult = blockResult.Value;
                    expressionStr = blockResult.Remaining;
                    closeString = blockResult.CloseString;
                }

                return new BlockToken(expressionResult, expressionStr, closeString);
            }
        }

        if (prevOperator != null)
            expressionResult = this.GetOperatorExpression(prevOperator.Value, expressionResult, operand);
        else
            expressionResult = operand;

        if (operatorToken == null) {
            if (expressionResult != null) {
                operatorToken = this.GetOperator(expressionStr, TernaryOperators);
                if (operatorToken != null) {
                    expressionStr = this.RemoveComments(expressionStr.substr(1));
                    const trueValueResult = this.GetBlock(expressionStr, undefined, undefined, paramContext);
                    if (trueValueResult == null)
                        throw new Error("ternary true value must exist\n\tOrigin: " + expressionStr +
                            "\n\tBlockResult: null");
                    if (trueValueResult.CloseString !== ":")
                        throw new Error("ternary true value must be closed with ':'\n\tOrigin: " + expressionStr +
                            "\n\tBlockResult: " + JSON.stringify(trueValueResult));

                    const trueOperand = trueValueResult.Value;
                    const falseValueResult = this.GetBlock(trueValueResult.Remaining, undefined, undefined, paramContext);
                    if (falseValueResult == null)
                        throw new Error("ternary false value must exist\n\tOrigin: " + expressionStr +
                            "\n\tBlockResult: null");

                    const falseOperand = falseValueResult.Value;
                    expressionResult = Expression.TernaryExpression.Create(expressionResult, trueOperand, falseOperand);
                    expressionStr = falseValueResult.Remaining;
                    prevOperators.shift();
                    return new BlockToken(expressionResult, expressionStr, falseValueResult.CloseString);
                }
            }
        }

        if (expressionStr) {
            closeString = expressionStr[0];
            expressionStr = this.RemoveComments(expressionStr.substring(1));
        }

        if (expressionResult == null)
            return null;

        return new BlockToken(expressionResult, expressionStr, closeString);
    }

    protected GetOperand(expressionStr: string, prevOperator?: OperatorToken, paramContext?: { [key: string]: any }): OperandToken | null {
        if (!expressionStr && prevOperator)
            return null;

        let operand: IExpression | null = null;

        if (prevOperator && prevOperator.Value === ".") {
            const match = expressionStr.match(/^[_a-z][_a-z0-9]*/i);
            if (match == null)
                throw new Error("Access to invalid member name");

            const intValue = parseFloat(match[0]);
            if (!isNaN(intValue))
                operand = Expression.ValueExpression.Create(intValue);
            else
                operand = Expression.ValueExpression.Create(match[0]);

            expressionStr = this.RemoveComments(expressionStr.substring(match[0].length));
            return new OperandToken(operand, expressionStr);
        }
        else {
            const singleOperator = this.GetOperator(expressionStr, UnaryOperators);
            if (singleOperator != null) {
                const nestOperand = this.GetOperand(singleOperator.Remaining, undefined, paramContext) as OperandToken;
                operand = this.GetOperatorExpression(singleOperator.Value, undefined, nestOperand.Value);
                return new OperandToken(operand, nestOperand.Remaining);
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
                    operand = Expression.ValueExpression.Create(expressionStr.substring(1, startIndex));
                    expressionStr = this.RemoveComments(expressionStr.substring(startIndex + 1));
                    break;
                case "(":
                    expressionStr = this.RemoveComments(expressionStr.substring(1));
                    const blockResult = this.GetBlock(expressionStr, undefined, undefined, paramContext);
                    if (blockResult == null)
                        throw new Error("block cannot contain empty expression\n\tOrigin: " + expressionStr +
                            "\n\tBlockResult: null");
                    if (blockResult.CloseString !== ")")
                        throw Error("Block not closed correctly.\n\tInput" + expressionStr + "\n\tResult: " + JSON.stringify(blockResult));

                    operand = blockResult.Value;
                    expressionStr = blockResult.Remaining;
                    break;
                case "[":
                    expressionStr = this.RemoveComments(expressionStr.substring(1));
                    const arrayValue = [];
                    while (true) {
                        const arrayParamResult = this.GetBlock(expressionStr, undefined, undefined, paramContext);
                        if (arrayParamResult == null)
                            throw Error("asdasd");
                        expressionStr = arrayParamResult.Remaining;
                        if (arrayParamResult.Value !== undefined || arrayParamResult.CloseString !== "]")
                            arrayValue.push(arrayParamResult.Value);
                        if (arrayParamResult.CloseString === "]")
                            break;
                    }
                    operand = Expression.ArrayValueExpression.Create(...arrayValue);
                    break;
                case "{":
                    // only for object. not supported for other
                    expressionStr = this.RemoveComments(expressionStr.substring(1));
                    const objectValue: { [key: string]: Expression.IExpression } = {};
                    while (true) {
                        const operators: OperatorToken[] = [];
                        if (!(expressionStr[0] === '"' || expressionStr[0] === "'"))
                            operators.push(new OperatorToken("", new ExpressionOperator(".", 10)));

                        const objProperty = this.GetOperand(expressionStr, operators[0], paramContext);
                        if (objProperty == null)
                            break;
                        if (objProperty.Remaining[0] !== ":")
                            throw new Error("object property must be followed by ':'\n\tOrigin: " + expressionStr +
                                "\n\tBlockResult: " + JSON.stringify(objProperty));
                        if (!(objProperty.Value instanceof Expression.ValueExpression))
                            throw new Error("object property don't support expression");

                        const propertyName = objProperty.Value.execute();
                        if (typeof propertyName !== "string")
                            throw new Error("object only support string property name");

                        expressionStr = this.RemoveComments(objProperty.Remaining.substr(1));
                        const objPropertyValue = this.GetBlock(expressionStr, undefined, undefined, paramContext);
                        if (objPropertyValue == null)
                            throw Error("Property Value must be defined");
                        expressionStr = objPropertyValue.Remaining;
                        if (objPropertyValue.Value !== undefined || objPropertyValue.CloseString !== "}")
                            objectValue[propertyName] = objPropertyValue.Value;
                        if (objPropertyValue.CloseString === "}")
                            break;
                    }
                    operand = Expression.ObjectValueExpression.Create(objectValue);
                    break;
                default:
                    // TODO: context
                    const match = expressionStr.match(/^([0-9][\.0-9]*|[_a-z][_a-z0-9]*)/i);
                    if (match === null) {
                        return null;
                    }

                    const matchedStr = match[0];
                    expressionStr = this.RemoveComments(expressionStr.substring(matchedStr.length));
                    if (paramContext && paramContext.hasOwnProperty(matchedStr)) {
                        operand = Expression.ValueExpression.Create(paramContext[matchedStr], matchedStr);
                    }
                    else if (GlobalObjects.hasOwnProperty(matchedStr))
                        operand = Expression.ValueExpression.Create(GlobalObjects[matchedStr], matchedStr);
                    else if (matchedStr === "undefined") {
                        operand = Expression.ValueExpression.Create(undefined);
                    }
                    else if (matchedStr === "null") {
                        operand = Expression.ValueExpression.Create(null);
                    }
                    else {
                        const intValue = parseFloat(match[0]);
                        if (!isNaN(intValue))
                            operand = Expression.ValueExpression.Create(intValue);
                        else
                            throw new Error("Expression not match anywhere. You maybe forgot to add '" + expressionStr + "' param");
                    }
                    break;
            }
        }

        if (operand === null) {
            return null;
        }

        // check member access and method call
        let memberOperator = this.GetOperator(expressionStr, MemberOperators);
        while (memberOperator !== null) {
            expressionStr = memberOperator.Remaining;
            const nestOperand = this.GetOperand(expressionStr, memberOperator, paramContext);
            if (nestOperand == null)
                throw new Error("Access to invalid member name");

            expressionStr = nestOperand.Remaining;
            if (expressionStr[0] === "(") {
                expressionStr = this.RemoveComments(expressionStr.substr(1));
                const fnParams = [];
                let closeString = "";
                const errowFunctionRegex = /^([_a-z0-9,\s]+|\([_a-z0-9,\s]+\))\s*=>/;
                while (true) {
                    // need check for functionExpression here.
                    if (expressionStr.search(errowFunctionRegex) === 0) {
                        // function param
                        const arrowIndex = expressionStr.indexOf("=>");
                        const fnParamStr = expressionStr.substring(0, arrowIndex);
                        const functionBody = this.RemoveComments(expressionStr.substring(arrowIndex + 2));
                        if (functionBody[0] === "{")
                            throw new Error("Only simple arrow function allowed here.");

                        const innerFnParams = this.GetFunctionParams(fnParamStr);
                        const fnParamExpressions: Expression.ParameterExpression[] = [];
                        const fnParamContext: { [key: string]: any } = {};
                        for (const fnParam of innerFnParams) {
                            const paramExpression = Expression.ParameterExpression.Create(fnParam);
                            fnParamExpressions.push(paramExpression);
                            fnParamContext[fnParam] = paramExpression;
                        }
                        if (paramContext) {
                            for (const prop in paramContext) {
                                if (!fnParamContext.hasOwnProperty(prop))
                                    fnParamContext[prop] = paramContext[prop];
                            }
                        }

                        const functionBodyResult = this.GetBlock(functionBody, undefined, undefined, fnParamContext);
                        if (functionBodyResult == null)
                            throw new Error("Function must have a body statement");

                        expressionStr = functionBodyResult.Remaining;
                        closeString = functionBodyResult.CloseString;
                        fnParams.push(Expression.FunctionExpression.Create(functionBodyResult.Value, fnParamExpressions));
                    }
                    else {

                        const fnParamResult = this.GetBlock(expressionStr, undefined, undefined, paramContext);
                        if (fnParamResult === null) {
                            throw new Error("asdasda");
                        }

                        expressionStr = fnParamResult.Remaining;
                        if (fnParamResult.Value !== undefined || fnParamResult.CloseString !== ")")
                            fnParams.push(fnParamResult.Value);
                        closeString = fnParamResult.CloseString;
                    }

                    if (closeString === ")")
                        break;
                    else if (closeString !== ",")
                        throw new Error("Wrong function parameter sperator.");
                }
                operand = Expression.MethodCallExpression.Create(operand as any, fnParams, nestOperand.Value.execute());
            }
            else {
                operand = Expression.MemberAccessExpression.Create(operand as any, nestOperand.Value.execute());
            }

            memberOperator = this.GetOperator(expressionStr, MemberOperators);
        }

        // function call check here
        if (operand instanceof Expression.ValueExpression && expressionStr[0] === "(") {
            expressionStr = this.RemoveComments(expressionStr.substr(1));
            const fnParams = [];
            while (true) {
                const fnParamResult = this.GetBlock(expressionStr, undefined, undefined, paramContext);
                if (fnParamResult === null) {
                    throw new Error("asdasda");
                }

                expressionStr = fnParamResult.Remaining;
                if (fnParamResult.Value !== undefined || fnParamResult.CloseString !== ")")
                    fnParams.push(fnParamResult.Value);

                if (fnParamResult.CloseString === ")")
                    break;
            }
            operand = Expression.FunctionCallExpression.Create(operand.execute(), fnParams);
        }

        const rightUnaryOperator = this.GetOperator(expressionStr, RightUnaryOperators);
        if (rightUnaryOperator) {
            operand = this.GetOperatorExpression(rightUnaryOperator.Value, operand as any);
            expressionStr = rightUnaryOperator.Remaining;
        }

        return new OperandToken(operand as IExpression, expressionStr);
    }

    protected GetOperator(expression: string, operators = BinaryOperators) {
        if (expression) {
            let operator: ExpressionOperator | undefined;
            for (const operatorExp of operators) {
                if (expression.indexOf(operatorExp.Symbol) === 0) {
                    operator = operatorExp;
                    break;
                }
            }

            if (operator) {
                expression = this.RemoveComments(expression.substring(operator.Symbol.length));
                return new OperatorToken(expression, operator);
            }
        }

        return null;
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

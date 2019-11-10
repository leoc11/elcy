import { NullConstructor } from "../Common/Constant";
import { ParameterStack } from "../Common/ParameterStack";
import { GenericType } from "../Common/Type";
import { DbFunction } from "../Query/DbFunction";
import { ArrayValueExpression } from "./Expression/ArrayValueExpression";
import { FunctionCallExpression } from "./Expression/FunctionCallExpression";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { IExpression } from "./Expression/IExpression";
import { InstantiationExpression } from "./Expression/InstantiationExpression";
import { MemberAccessExpression } from "./Expression/MemberAccessExpression";
import { MethodCallExpression } from "./Expression/MethodCallExpression";
import { ObjectValueExpression } from "./Expression/ObjectValueExpression";
import { ParameterExpression } from "./Expression/ParameterExpression";
import { StringTemplateExpression } from "./Expression/StringTemplateExpression";
import { ValueExpression } from "./Expression/ValueExpression";
import { Associativity, IOperator, IOperatorPrecedence, IUnaryOperator, operators, OperatorType, UnaryPosition } from "./IOperator";
import { ILexicalToken, LexicalTokenType } from "./LexicalAnalyzer";

interface SyntaticParameter {
    index: number;
    paramTypes: GenericType[];
    scopedParameters: Map<string, ParameterExpression[]>;
    userParameters: ParameterStack;
}
const globalObjectMaps = new Map<string, any>([
    // Global Function
    ["parseInt", parseInt],
    ["parseFloat", parseFloat],
    ["decodeURI", decodeURI],
    ["decodeURIComponent", decodeURIComponent],
    ["encodeURI", encodeURI],
    ["encodeURIComponent", encodeURIComponent],
    ["isNaN", isNaN],
    ["isFinite", isFinite],
    ["eval", eval],

    // Fundamental Objects
    ["Object", Object],
    ["Function", Function],
    ["Boolean", Boolean],
    ["Symbol", Symbol],

    // Constructor/ Type
    ["Error", Error],
    ["Number", Number],
    ["Math", Math],
    ["Date", Date],
    ["String", String],
    ["RegExp", RegExp],
    ["Array", Array],
    ["Map", Map],
    ["Set", Set],
    ["WeakMap", WeakMap],
    ["WeakSet", WeakSet],
    ["ArrayBuffer", ArrayBuffer],
    ["Uint8Array", Uint8Array],
    ["Uint16Array", Uint16Array],
    ["Uint32Array", Uint32Array],
    ["Int8Array", Int8Array],
    ["Int16Array", Int16Array],
    ["Int32Array", Int32Array],
    ["Uint8ClampedArray", Uint8ClampedArray],
    ["Float32Array", Float32Array],
    ["Float64Array", Float64Array],
    ["DataView", DataView],

    // Value
    ["Infinity", Infinity],
    ["NaN", NaN],
    ["undefined", undefined],
    ["null", null],
    ["true", true],
    ["false", false],

    // Helper
    ["DbFunction", DbFunction]
]);
const prefixOperators = operators.where((o) => o.type === OperatorType.Unary && (o as IUnaryOperator).position === UnaryPosition.Prefix).toMap((o) => o.identifier);
const postfixOperators = operators.where((o) => o.type !== OperatorType.Unary || (o as IUnaryOperator).position === UnaryPosition.Postfix).toMap((o) => o.identifier);
export class SyntacticAnalyzer {
    public static parse(tokens: ILexicalToken[], paramTypes?: GenericType[], userParameters?: ParameterStack) {
        if (!userParameters) {
            userParameters = new ParameterStack();
        }
        if (!paramTypes) {
            paramTypes = [];
        }

        const param: SyntaticParameter = {
            index: 0,
            paramTypes: paramTypes,
            scopedParameters: new Map(),
            userParameters: userParameters
        };
        const result = createExpression(param, tokens);
        return result;
    }
}
function isGreatherThan(precedence1: IOperatorPrecedence, precedence2: IOperatorPrecedence) {
    if (precedence1.precedence === precedence2.precedence) {
        if (precedence1.associativity === Associativity.None) {
            return false;
        }
        else if (precedence2.associativity === Associativity.None) {
            return true;
        }
        return precedence1.associativity === Associativity.Left;
    }
    return precedence1.precedence >= precedence2.precedence;
}
function createExpression(param: SyntaticParameter, tokens: ILexicalToken[], expression?: IExpression, prevOperator?: IOperator): IExpression {
    while (param.index < tokens.length) {
        const token = tokens[param.index];
        switch (token.type) {
            case LexicalTokenType.Operator: {
                if (token.data === "=>") {
                    param.index++;
                    expression = createFunctionExpression(param, expression, tokens);
                }
                else {
                    const operator = (!expression ? prefixOperators : postfixOperators).get(token.data as string);
                    if (!operator || (prevOperator && isGreatherThan(prevOperator.precedence, operator.precedence))) {
                        return expression;
                    }

                    param.index++;
                    switch (operator.type) {
                        case OperatorType.Unary: {
                            const unaryOperator = operator as IUnaryOperator;
                            if (unaryOperator.position === UnaryPosition.Postfix) {
                                expression = operator.expressionFactory(expression);
                            }
                            else {
                                switch (operator.identifier) {
                                    case "new": {
                                        const typeExp = createExpression(param, tokens, null, operator);
                                        const paramToken = tokens[param.index];
                                        let params: IExpression[] = [];
                                        if (paramToken.type === LexicalTokenType.Operator && paramToken.data === "(") {
                                            param.index++;
                                            const exp = createParamExpression(param, tokens, ")");
                                            params = exp.items;
                                        }
                                        expression = new InstantiationExpression(typeExp as ValueExpression, params);
                                        break;
                                    }
                                    case "[": {
                                        if (!expression) {
                                            expression = createArrayExpression(param, tokens);
                                            break;
                                        }
                                        else {
                                            throw new Error("expression not supported");
                                        }
                                    }
                                    case "(": {
                                        if (expression) {
                                            throw new Error("expression not supported");
                                        }
                                        const arrayExp = createParamExpression(param, tokens, ")");
                                        if (arrayExp.items.length === 1) {
                                            expression = arrayExp.items[0];
                                        }
                                        else {
                                            expression = arrayExp;
                                        }
                                        break;
                                    }
                                    default: {
                                        const operand = createExpression(param, tokens, undefined, operator);
                                        expression = operator.expressionFactory(operand);
                                    }
                                }
                            }
                            break;
                        }
                        case OperatorType.Binary: {
                            if (operator.identifier === "(") {
                                const params = createParamExpression(param, tokens, ")");
                                if (expression instanceof MemberAccessExpression) {
                                    expression = new MethodCallExpression(expression.objectOperand, expression.memberName, params.items);
                                }
                                else {
                                    expression = new FunctionCallExpression(expression, params.items);
                                }
                                continue;
                            }
                            const operand = createExpression(param, tokens, undefined, operator);
                            if (operator.identifier === ".") {
                                const memberName = operand.toString();
                                expression = new MemberAccessExpression(expression, memberName);
                            }
                            else {
                                expression = operator.expressionFactory(expression, operand);
                            }
                            break;
                        }
                        case OperatorType.Ternary: {
                            const operand = createExpression(param, tokens);
                            param.index++;
                            const operand2 = createExpression(param, tokens);
                            expression = operator.expressionFactory(expression, operand, operand2);
                            break;
                        }
                    }
                    continue;
                }
                break;
            }
            case LexicalTokenType.Block: {
                param.index++;
                if (!expression) {
                    return createObjectExpression(param, tokens);
                }
                else {
                    throw new Error("expression not supported");
                }
            }
            case LexicalTokenType.Breaker: {
                return expression;
            }
            case LexicalTokenType.Keyword: {
                param.index++;
                return createKeywordExpression(param, token, tokens);
            }
            case LexicalTokenType.Number: {
                expression = new ValueExpression(Number.parseFloat(token.data as string));
                param.index++;
                break;
            }
            case LexicalTokenType.String: {
                expression = new ValueExpression(token.data as string);
                param.index++;
                break;
            }
            case LexicalTokenType.StringTemplate: {
                expression = new StringTemplateExpression(token.data as string);
                param.index++;
                break;
            }
            case LexicalTokenType.Regexp: {
                const dataStr = token.data as string;
                const last = dataStr.lastIndexOf("/");
                expression = new ValueExpression(new RegExp(dataStr.substring(1, last), dataStr.substring(last + 1)), dataStr);
                param.index++;
                break;
            }
            case LexicalTokenType.Identifier: {
                expression = createIdentifierExpression(param, token, tokens);
                param.index++;
                break;
            }
            default: {
                param.index++;
            }
        }
    }
    return expression;
}
function createArrayExpression(param: SyntaticParameter, tokens: ILexicalToken[]) {
    const arrayVal: any[] = [];
    while (param.index < tokens.length && (tokens[param.index].data !== "]")) {
        arrayVal.push(createExpression(param, tokens));
        if (tokens[param.index].data === ",") {
            param.index++;
        }
    }
    param.index++;
    return new ArrayValueExpression(...arrayVal);
}
function createObjectExpression(param: SyntaticParameter, tokens: ILexicalToken[]) {
    const obj: any = {};
    while (param.index < tokens.length && (tokens[param.index].data !== "}")) {
        const propName = tokens[param.index].data;
        if (tokens[param.index + 1].data === ":") {
            param.index += 2;
        }
        const value = createExpression(param, tokens);
        obj[propName] = value;
        if (tokens[param.index].data === ",") {
            param.index++;
        }
    }
    param.index++;
    return new ObjectValueExpression(obj);
}
function createParamExpression(param: SyntaticParameter, tokens: ILexicalToken[], stopper: string) {
    const arrayVal = [];
    while (param.index < tokens.length && (tokens[param.index].data !== stopper)) {
        arrayVal.push(createExpression(param, tokens));
        if (tokens[param.index].data === ",") {
            param.index++;
        }
    }
    param.index++;
    return new ArrayValueExpression(...arrayVal);
}
function createIdentifierExpression(param: SyntaticParameter, token: ILexicalToken, tokens: ILexicalToken[]): IExpression {
    if (typeof token.data === "string" && param.scopedParameters.has(token.data)) {
        const params = param.scopedParameters.get(token.data as string);
        if (params.length > 0) {
            return params[0];
        }
    }

    let data = param.userParameters.get(token.data as string);
    if (data) {
        return new ParameterExpression(token.data as string, getConstructor(data));
    }
    else if (globalObjectMaps.has(token.data as string)) {
        data = globalObjectMaps.get(token.data as string);
        return new ValueExpression(data, token.data as string);
    }

    const type = param.paramTypes.shift();
    return new ParameterExpression(token.data as string, type);
}
function getConstructor(data: any) {
    if (data) {
        let constructor = data.constructor;
        if (constructor === Object) {
            // tslint:disable-next-line: no-empty
            constructor = function Object() {};
            constructor.prototype = data;
        }
        return constructor;
    }
    return NullConstructor;
}
function createKeywordExpression(param: SyntaticParameter, token: ILexicalToken, tokens: ILexicalToken[]): IExpression {
    throw new Error(`keyword ${token.data} not supported`);
}
function createFunctionExpression(param: SyntaticParameter, expression: IExpression, tokens: ILexicalToken[]) {
    const params: ParameterExpression[] = expression instanceof ArrayValueExpression ? expression.items as any : expression ? [expression] : [];
    const token = tokens[param.index];
    for (const paramExp of params) {
        let paramsL = param.scopedParameters.get(paramExp.name);
        if (!paramsL) {
            paramsL = [];
            param.scopedParameters.set(paramExp.name, paramsL);
        }
        paramsL.unshift(paramExp);
    }
    let body: IExpression;
    if (token.type === LexicalTokenType.Block) {
        param.index += 2;
    }
    body = createExpression(param, tokens);
    for (const paramExp of params) {
        const paramsL = param.scopedParameters.get(paramExp.name);
        paramsL.shift();
    }
    return new FunctionExpression(body, params);
}

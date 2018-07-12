import { ILexicalToken, LexicalTokenType } from "./LexicalAnalyzer";
import { GenericType } from "../Common/Type";
import { ParameterExpression } from "./Expression/ParameterExpression";
import { IExpression } from "./Expression/IExpression";
import { ValueExpression } from "./Expression/ValueExpression";
import { ArrayValueExpression } from "./Expression/ArrayValueExpression";
import { ObjectValueExpression } from "./Expression/ObjectValueExpression";
import { FunctionCallExpression } from "./Expression/FunctionCallExpression";
import { InstantiationExpression } from "./Expression/InstantiationExpression";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { IOperator, Associativity, operators, OperatorType, IUnaryOperator, UnaryPosition, IOperatorPrecedence } from "./IOperator";
import { Enumerable } from "../Enumerable/Enumerable";
import { MemberAccessExpression } from "./Expression/MemberAccessExpression";
import { MethodCallExpression } from "./Expression/MethodCallExpression";
interface SyntaticParameter {
    index: number;
    types: GenericType[];
    scopedParameters: Map<string, ParameterExpression[]>;
    userParameters: { [key: string]: any };
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

    // Value
    ["Infinity", Infinity],
    ["NaN", NaN],
    ["undefined", undefined],
    ["null", null],
    ["true", true],
    ["false", false],
]);
const prefixOperators = operators.where(o => o.type === OperatorType.Unary && (o as IUnaryOperator).position === UnaryPosition.Prefix).toArray().toMap(o => o.identifier);
const postfixOperators = operators.where(o => o.type !== OperatorType.Unary || (o as IUnaryOperator).position === UnaryPosition.Postfix).toArray().toMap(o => o.identifier);
export class SyntacticAnalyzer {
    public static parse(tokens: IterableIterator<ILexicalToken>, paramTypes: GenericType[] = [], userParameters: { [key: string]: any } = {}) {
        const param: SyntaticParameter = {
            index: 0,
            types: paramTypes,
            scopedParameters: new Map(),
            userParameters: userParameters
        };
        const result = createExpression(param, new Enumerable(tokens).toArray());
        return result;
    }
}
function isGreatherThan(precedence1: IOperatorPrecedence, precedence2: IOperatorPrecedence) {
    if (precedence1.precedence === precedence2.precedence) {
        return precedence1.associativity !== Associativity.Right;
    }
    return precedence1.precedence >= precedence2.precedence;
}
function createExpression(param: SyntaticParameter, tokens: ILexicalToken[], expression?: IExpression, prevOperator?: IOperator) {
    while (param.index < tokens.length) {
        let token = tokens[param.index];
        switch (token.type) {
            case LexicalTokenType.Operator: {
                if (token.data === "=>") {
                    param.index++;
                    expression = createFunctionExpression(param, expression, tokens);
                }
                else {
                    const operator = (!expression ? prefixOperators : postfixOperators).get(token.data as string);
                    if (prevOperator && isGreatherThan(prevOperator.precedence, operator.precedence))
                        return expression;

                    param.index++;
                    switch (operator.type) {
                        case OperatorType.Unary: {
                            const unaryOperator = operator as IUnaryOperator;
                            if (unaryOperator.position === UnaryPosition.Postfix) {
                                expression = operator.expressionFactory(expression);
                            }
                            else {
                                if (operator.identifier === "new") {
                                    const typeExp = createIdentifierExpression(param, tokens[param.index++], tokens) as ValueExpression<any>;
                                    const paramToken = tokens[param.index];
                                    let params: IExpression[] = [];
                                    if (paramToken.type === LexicalTokenType.Parenthesis && paramToken.data === "(") {
                                        param.index++;
                                        const exp = createParamExpression(param, tokens);
                                        params = exp.items;
                                    }
                                    expression = InstantiationExpression.create(typeExp.value, params);
                                }
                                else {
                                    const operand = createExpression(param, tokens, undefined, operator);
                                    expression = operator.expressionFactory(operand);
                                }
                            }
                            break;
                        }
                        case OperatorType.Binary: {
                            const operand = operator.identifier === "." ? tokens[param.index++].data : createExpression(param, tokens, undefined, operator);
                            expression = operator.expressionFactory(expression, operand);
                            break;
                        }
                        case OperatorType.Ternary: {
                            const operand = createExpression(param, tokens);
                            const operand2 = createExpression(param, tokens);
                            expression = operator.expressionFactory(expression, operand, operand2);
                            break;
                        }
                    }
                    continue;
                }
                break;
            }
            case LexicalTokenType.Breaker: {
                return expression;
            }
            case LexicalTokenType.Keyword: {
                param.index++;
                return createKeywordExpression(param, token, tokens);
            }
            case LexicalTokenType.Parenthesis: {
                switch (token.data) {
                    case "{": {
                        // TODO
                        param.index++;
                        if (!expression) {
                            return createObjectExpression(param, tokens);
                        }
                        else {
                            throw new Error("expression not supported");
                        }
                    }
                    case "[": {
                        // TODO
                        param.index++;
                        if (!expression) {
                            return createArrayExpression(param, tokens);
                        }
                        else {
                            throw new Error("expression not supported");
                        }
                    }
                    case "(": {
                        param.index++;
                        const paramExpression = createParamExpression(param, tokens);
                        if (expression) {
                            if (expression instanceof MemberAccessExpression) {
                                expression = MethodCallExpression.Create(expression.objectOperand, paramExpression.items, expression.memberName);
                            }
                            else if (expression instanceof ValueExpression && expression.value instanceof Function) {
                                expression = FunctionCallExpression.create(expression.value, paramExpression.items, expression.toString());
                            }
                            else {
                                throw new Error("expression not supported");
                            }
                        }
                        else {
                            expression = paramExpression;
                        }
                    }
                }
                break;
            }
            case LexicalTokenType.Number: {
                expression = ValueExpression.create(Number.parseFloat(token.data as string));
                param.index++;
                break;
            }
            case LexicalTokenType.String: {
                expression = ValueExpression.create(token.data as string);
                param.index++;
                break;
            }
            case LexicalTokenType.Regexp: {
                const dataStr = token.data as string;
                const last = dataStr.lastIndexOf("/");
                expression = ValueExpression.create(new RegExp(dataStr.substring(1, last), dataStr.substring(last + 1)));
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
    }
    param.index++;
    return ArrayValueExpression.create(...arrayVal);
}
function createObjectExpression(param: SyntaticParameter, tokens: ILexicalToken[]) {
    const obj: any = {};
    while (param.index < tokens.length && (tokens[param.index].data !== "}")) {
        const propName = tokens[param.index].data;
        param.index += 2;
        const value = createExpression(param, tokens);
        obj[propName] = value;
        if (tokens[param.index].data === ",")
            param.index++;
    }
    return ObjectValueExpression.create(obj);
}
function createParamExpression(param: SyntaticParameter, tokens: ILexicalToken[]) {
    const expressions: IExpression[] = [];
    while (param.index < tokens.length && (tokens[param.index].data !== ")")) {
        expressions.push(createExpression(param, tokens));
    }
    param.index++;
    return new ArrayValueExpression(...expressions);
}
function createIdentifierExpression(param: SyntaticParameter, token: ILexicalToken): IExpression {
    if (param.scopedParameters.has(token.data as string)) {
        const params = param.scopedParameters.get(token.data as string);
        if (params.length > 0)
            return params[0];
    }
    else if (param.userParameters[token.data as string] !== undefined) {
        const data = param.userParameters[token.data as string];
        if (data instanceof Function) {
            return new ValueExpression(data, token.data as string);
        }
        else {
            return new ParameterExpression(token.data as string, data.constructor);
        }
    }
    else if (globalObjectMaps.has(token.data as string)) {
        const data = globalObjectMaps.get(token.data as string);
        return new ValueExpression(data, token.data as string);
    }
    return new ParameterExpression(token.data as string);
}
function createKeywordExpression(token: ILexicalToken): IExpression {
    throw new Error(`keyword ${token.data} not supported`);
}
function createFunctionExpression(param: SyntaticParameter, expression: IExpression, tokens: ILexicalToken[]) {
    const params: ParameterExpression[] = expression instanceof ArrayValueExpression ? expression.items as any : [expression] as any;
    const token = tokens[param.index];
    for (const paramExp of params) {
        paramExp.type = param.types.shift();
        let paramsL = param.scopedParameters.get(paramExp.name);
        if (!paramsL) {
            paramsL = [];
            param.scopedParameters.set(paramExp.name, paramsL);
        }
        paramsL.unshift(paramExp);
    }
    let body: IExpression;
    if (token.type === LexicalTokenType.Parenthesis) {
        param.index++;
        if (token.data === "{")
            param.index++;
    }
    body = createExpression(param, tokens);
    for (const paramExp of params) {
        let paramsL = param.scopedParameters.get(paramExp.name);
        paramsL.shift();
    }
    return new FunctionExpression(body, params);
}
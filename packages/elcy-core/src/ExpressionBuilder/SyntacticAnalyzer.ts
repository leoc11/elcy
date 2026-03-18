import { Uuid } from "src/Data/Uuid";
import { NullConstructor } from "../Common/Constant";
import { GenericType, IObjectType } from "../Common/Type";
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
import { Enumerable } from "@elcy/enumerable";
import { TimeSpan } from "src/Data/TimeSpan";
import { Temporal } from "src/Data/Temporal";
import { Decimal } from "src/Data/Decimal";

interface SyntaticParameter {
    index: number;
    paramTypes: GenericType[];
    scopedParameters: Map<string, ParameterExpression[]>;
    userParameters: { [key: string]: unknown };
}
const globalObjectMaps = new Map<string, unknown>([
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
    ["BigInt", BigInt],
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
    ["DbFunction", DbFunction],

    // data model
    ["Uuid", Uuid],
    ["TimeSpan", TimeSpan]
]);

if (Temporal) {
    globalObjectMaps.set("Temporal", Temporal);
}
if (Decimal) {
    globalObjectMaps.set("Decimal", Decimal);
}

const [prefixOperators, postfixOperators] = Enumerable.from(operators)
    .groupBy(o => o.type === OperatorType.Unary && (o as IUnaryOperator).position === UnaryPosition.Prefix)
    .orderBy([o => o.key, "DESC"])
    .map(d => d.toMap((o) => o.identifier));
export class SyntacticAnalyzer {
    public static parse(tokens: ILexicalToken[], paramTypes?: GenericType[], userParameters?: { [key: string]: unknown }) {
        if (!userParameters) {
            userParameters = {};
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
                                        const typeExp = createExpression(param, tokens, null, operator) as ValueExpression<IObjectType>;
                                        const paramToken = tokens[param.index];
                                        let params: IExpression[] = [];
                                        if (paramToken.type === LexicalTokenType.Operator && paramToken.data === "(") {
                                            param.index++;
                                            const exp = createParamExpression(param, tokens, ")");
                                            params = exp.items;
                                        }
                                        expression = new InstantiationExpression(typeExp, params);
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
                            if (operator.identifier === "?.") {
                                const nextToken = tokens[param.index];
                                if (nextToken.type === LexicalTokenType.Operator && nextToken.data === "(") {
                                    param.index++;
                                    const params = createParamExpression(param, tokens, ")");
                                    if (expression instanceof MemberAccessExpression) {
                                        const mcExp = new MethodCallExpression(expression.objectOperand, expression.memberName, params.items);
                                        mcExp.isOptional = expression.isOptional;
                                        mcExp.isOptionalCall = true;
                                        expression = mcExp;
                                    }
                                    else {
                                        const fcExp = new FunctionCallExpression(expression as IExpression<() => unknown>, params.items);
                                        fcExp.isOptionalCall = true;
                                        expression = fcExp;
                                    }
                                    continue;
                                }
                                else if (nextToken.type === LexicalTokenType.Operator && nextToken.data === "[") {
                                    throw "element access not supported";
                                }
                            }
                            else if (operator.identifier === "(") {
                                const params = createParamExpression(param, tokens, ")");
                                if (expression instanceof MemberAccessExpression) {
                                    const mcExp = new MethodCallExpression(expression.objectOperand, expression.memberName, params.items);
                                    mcExp.isOptional = expression.isOptional;
                                    expression = mcExp;
                                }
                                else {
                                    expression = new FunctionCallExpression(expression as IExpression<() => unknown>, params.items);
                                }
                                continue;
                            }
                            else if (operator.identifier === "[") {
                                throw "element access not supported";
                            }

                            const operand = createExpression(param, tokens, undefined, operator);
                            expression = operator.expressionFactory(expression, operand);
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
                return createKeywordExpression(param, token);
            }
            case LexicalTokenType.Number: {
                const datas = token.data as string;
                if (datas[datas.length - 1] === 'n') {
                    expression = new ValueExpression(BigInt(datas.slice(0, -1)));
                }
                else {
                    expression = new ValueExpression(Number.parseFloat(datas));
                }
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
                expression = createIdentifierExpression(param, token);
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
    const arrayVal: IExpression[] = [];
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
    const obj: unknown = {};
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
    const arrayVal: IExpression[] = [];
    while (param.index < tokens.length && (tokens[param.index].data !== stopper)) {
        arrayVal.push(createExpression(param, tokens));
        if (tokens[param.index].data === ",") {
            param.index++;
        }
    }
    param.index++;
    return new ArrayValueExpression(...arrayVal);
}
function createIdentifierExpression(param: SyntaticParameter, token: ILexicalToken): IExpression {
    if (typeof token.data === "string" && param.scopedParameters.has(token.data)) {
        const params = param.scopedParameters.get(token.data);
        if (params.length > 0) {
            return params[0];
        }
    }
    if (Object.prototype.hasOwnProperty.call(param.userParameters, token.data)) {
        const data = param.userParameters[token.data];
        return new ParameterExpression(token.data as string, getConstructor(data));
    }
    else if (globalObjectMaps.has(token.data as string)) {
        const data = globalObjectMaps.get(token.data as string);
        return new ValueExpression(data, token.data as string);
    }

    const type = param.paramTypes.shift();
    return new ParameterExpression(token.data as string, type);
}
function getConstructor(data: unknown): GenericType {
    if (data) {
        let constructor = data.constructor as GenericType;
        if (constructor === Object) {
            // tslint:disable-next-line: no-empty
            constructor = function Object() { /* empty object*/ };
            constructor.prototype = data;
        }
        return constructor;
    }
    return NullConstructor;
}
function createKeywordExpression(param: SyntaticParameter, token: ILexicalToken): IExpression {
    throw new Error(`keyword ${token.data} not supported`);
}
function createFunctionExpression(param: SyntaticParameter, expression: IExpression, tokens: ILexicalToken[]) {
    const params = (expression instanceof ArrayValueExpression ? expression.items : expression ? [expression] : []) as ParameterExpression[];
    const token = tokens[param.index];
    for (const paramExp of params) {
        let paramsL = param.scopedParameters.get(paramExp.name);
        if (!paramsL) {
            paramsL = [];
            param.scopedParameters.set(paramExp.name, paramsL);
        }
        paramsL.unshift(paramExp);
    }
    if (token.type === LexicalTokenType.Block) {
        param.index += 2;
    }
    const body = createExpression(param, tokens);
    for (const paramExp of params) {
        const paramsL = param.scopedParameters.get(paramExp.name);
        paramsL.shift();
    }
    return new FunctionExpression(body, params);
}

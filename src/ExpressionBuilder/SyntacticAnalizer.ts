import { ILexicalToken, LexicalTokenType } from "./LexicalAnalizer";
import { GenericType } from "../Common/Type";
import { ParameterExpression } from "./Expression/ParameterExpression";
import { IExpression } from "./Expression/IExpression";
import { ValueExpression } from "./Expression/ValueExpression";
import { ArrayValueExpression } from "./Expression/ArrayValueExpression";
import { ObjectValueExpression } from "./Expression/ObjectValueExpression";
import { FunctionCallExpression } from "./Expression/FunctionCallExpression";
import { isNativeFunction } from "../Helper/Util";
import { InstantiationExpression } from "./Expression/InstantiationExpression";
import { AdditionExpression } from "./Expression/AdditionExpression";
import { SubtractionExpression } from "./Expression/SubtractionExpression";
import { DivisionExpression } from "./Expression/DivisionExpression";
import { MultiplicationExpression } from "./Expression/MultiplicationExpression";
import { MemberAccessExpression } from "./Expression/MemberAccessExpression";
import { LeftIncrementExpression } from "./Expression/LeftIncrementExpression";
import { RightIncrementExpression } from "./Expression/RightIncrementExpression";
import { LeftDecrementExpression } from "./Expression/LeftDecrementExpression";
import { RightDecrementExpression } from "./Expression/RightDecrementExpression";
import { AndExpression } from "./Expression/AndExpression";
import { NotEqualExpression } from "./Expression/NotEqualExpression";
import { StrictNotEqualExpression } from "./Expression/StrictNotEqualExpression";
import { EqualExpression } from "./Expression/EqualExpression";
import { StrictEqualExpression } from "./Expression/StrictEqualExpression";
import { GreaterThanExpression } from "./Expression/GreaterThanExpression";
import { GreaterEqualExpression } from "./Expression/GreaterEqualExpression";
import { LessThanExpression } from "./Expression/LessThanExpression";
import { LessEqualExpression } from "./Expression/LessEqualExpression";
import { OrExpression } from "./Expression/OrExpression";
import { NegationExpression } from "./Expression/NegationExpression";
import { BitwiseAndExpression } from "./Expression/BitwiseAndExpression";
import { BitwiseOrExpression } from "./Expression/BitwiseOrExpression";
import { BitwiseNotExpression } from "./Expression/BitwiseNotExpression";
import { BitwiseXorExpression } from "./Expression/BitwiseXorExpression";
import { BitwiseZeroLeftShiftExpression } from "./Expression/BitwiseZeroLeftShiftExpression";
import { BitwiseZeroRightShiftExpression } from "./Expression/BitwiseZeroRightShiftExpression";
import { BitwiseSignedRightShiftExpression } from "./Expression/BitwiseSignedRightShiftExpression";
import { TypeofExpression } from "./Expression/TypeofExpression";
import { InstanceofExpression } from "./Expression/InstanceofExpression";
import { FunctionExpression } from "./Expression/FunctionExpression";
import { MethodCallExpression } from "./Expression/MethodCallExpression";
import { IOperator, Associativity } from "./IOperator";
const operatorPrecedenceMap = new Map([
    ["(", 20], // grouping
    [".", 19], // member access
    ["\[", 19], // computed member access
    // new with arguments
    // function call
    ["new", 18],
    ["++", 17], // postfix
    ["--", 17], // postfix
    ["typeof", 16],
    ["void", 16],
    ["delete", 16],
    ["await", 16],
    ["++", 16], // prefix
    ["--", 16], // prefix
    ["!", 16],
    ["~", 16],
    ["+", 16], // unary
    ["-", 16], // unary
    ["**", 15],
    ["*", 14],
    ["/", 14],
    ["%", 14],
    ["-", 13],
    ["+", 13],
    [">>>", 12],
    ["<<", 12],
    [">>", 12],
    [">=", 11],
    ["<=", 11],
    [">", 11],
    ["<", 11],
    ["instanceof", 11],
    ["in", 11],
    ["===", 10],
    ["!==", 10],
    ["==", 10],
    ["!=", 10],
    ["&", 9],
    ["^", 8],
    ["|", 7],
    ["&&", 6],
    ["||", 5],
    ["?", 4],
    [">>>=", 3],
    [">>=", 3],
    ["<<=", 3],
    ["**=", 3],
    ["&=", 3],
    ["^=", 3],
    ["|=", 3],
    ["+=", 3],
    ["-=", 3],
    ["*=", 3],
    ["/=", 3],
    ["%=", 3],
    ["=", 3],
    ["yield*", 2],
    ["yield", 2],
    [",", 1],
]);
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
export class SyntacticAnalizer {
    public static parse(tokens: ILexicalToken[], paramTypes: GenericType[] = [], userParameters: { [key: string]: any } = {}) {
        const param: SyntaticParameter = {
            index: 0,
            types: paramTypes,
            scopedParameters: new Map(),
            userParameters: userParameters
        };
        const result = createExpression(param, tokens);
        return result;
    }
}
function precedenceCheck(operator1: IOperator, operator2: IOperator) {
    let rank = operator1.precedence - operator2.precedence;
    if (rank === 0) {
        if (operator1.associativity === Associativity.Right)
            rank = -1;
    }
    return rank;
}
function createExpression(param: SyntaticParameter, tokens: ILexicalToken[], expression?: IExpression, prevOperatorRank?: number) {
    while (param.index < tokens.length) {
        const token = tokens[param.index];
        switch (token.type) {
            case LexicalTokenType.Operator: {
                if (token.data === "=>") {
                    param.index++;
                    expression = createFunctionExpression(param, [expression] as any, tokens);
                }
                else {
                    const rank = operatorPrecedenceMap.get(token.data as string);
                    if (precedenceCheck(prevOperatorRank, rank) > 0)
                        return expression;
                    param.index++;
                    const nextToken = tokens[param.index + 1];
                    if (nextToken && nextToken.type === LexicalTokenType.Parenthesis && nextToken.data === ")") {
                        const nameToken = tokens[param.index++];
                        const paramToken = tokens[param.index++];
                        if (expression.itemType)
                            param.types = [expression.itemType];
                        const params = createParamsExpression(param, paramToken.childrens);
                        param.types = [];
                        expression = new MethodCallExpression(expression, nameToken.data as string, params);
                        continue;
                    }
                    const operand = createExpression(param, tokens, undefined, rank);
                    expression = createOperatorExpression(param, expression, token, operand, tokens);
                    continue;
                }
                break;
            }
            case LexicalTokenType.Breaker:
                return expression;
            case LexicalTokenType.Keyword:
                param.index++;
                return createKeywordExpression(param, token, tokens);
            case LexicalTokenType.Parenthesis: {
                if (!expression) {
                    if (token.data === "}") {
                        param.index++;
                        return createObjectExpression(param, token.childrens);
                    }
                    else if (token.data === "]") {
                        param.index++;
                        return createArrayExpression(param, token.childrens);
                    }
                }
                const expressions = createParamsExpression(param, token.childrens);
                const nextToken = tokens[param.index + 1];
                if (nextToken && nextToken.type === LexicalTokenType.Operator && nextToken.data === "=>") {
                    param.index += 2;
                    expression = createFunctionExpression(param, expressions as any, tokens);
                }
                else {
                    expression = expressions[0];
                }
                break;
            }
            case LexicalTokenType.Number:
                expression = new ValueExpression(Number.parseFloat(token.data as string));
                break;
            case LexicalTokenType.String:
                expression = new ValueExpression(token.data as string);
                break;
            case LexicalTokenType.Regexp: {
                const dataStr = token.data as string;
                const last = dataStr.lastIndexOf("/");
                expression = new ValueExpression(new RegExp(dataStr.substring(1, last), dataStr.substring(last + 1)));
                break;
            }
            case LexicalTokenType.Identifier: {
                expression = createIdentifierExpression(param, token, tokens);
                break;
            }
            default:
                continue;
        }
        param.index++;
    }
    return expression;
}
function createParamsExpression(param: SyntaticParameter, tokens: ILexicalToken[]) {
    const index = param.index;
    param.index = 0;
    const result: IExpression[] = [];
    while (param.index < tokens.length) {
        result.push(createExpression(param, tokens));
    }
    param.index = index;
    return result;
}
function createArrayExpression(param: SyntaticParameter, tokens: ILexicalToken[]) {
    const arrayVal: any[] = [];
    const index = param.index;
    param.index = 0;
    while (param.index < tokens.length) {
        arrayVal.push(createExpression(param, tokens));
    }
    param.index = index;
    return ArrayValueExpression.create(...arrayVal);
}
function createObjectExpression(param: SyntaticParameter, tokens: ILexicalToken[]) {
    const obj: any = {};
    const index = param.index;
    param.index = 0;
    while (param.index < tokens.length) {
        const propName = tokens[param.index++].data;
        param.index++;
        const value = createExpression(param, tokens);
        obj[propName] = value;
        param.index++;
    }
    param.index = index;
    return ObjectValueExpression.create(obj);
}
function createIdentifierExpression(param: SyntaticParameter, token: ILexicalToken, tokens: ILexicalToken[]): IExpression {
    if (param.scopedParameters.has(token.data as string)) {
        const params = param.scopedParameters.get(token.data as string);
        if (params.length > 0)
            return params[0];
    }
    else if (param.userParameters[token.data as string] !== undefined) {
        const data = param.userParameters[token.data as string];
        if (data instanceof Function) {
            const paramToken = tokens[++param.index];
            const params = createParamsExpression(param, paramToken.childrens);
            return new FunctionCallExpression(data as any, token.data as string, params);
        }
        else {
            return new ParameterExpression(token.data as string, data.constructor);
        }
    }
    else if (globalObjectMaps.has(token.data as string)) {
        const data = globalObjectMaps.get(token.data as string);
        if (data instanceof Function && isNativeFunction(data)) {
            const paramToken = tokens[++param.index];
            const params = createParamsExpression(param, paramToken.data as any);
            return new FunctionCallExpression(data as any, token.data as string, params);
        }
        else {
            return new ValueExpression(data, token.data as string);
        }
    }
    return new ParameterExpression(token.data as string);
}
function createKeywordExpression(param: SyntaticParameter, token: ILexicalToken, tokens: ILexicalToken[]): IExpression {
    switch (token.data) {
        case "new":
            const typeExp = createIdentifierExpression(param, tokens[param.index++], tokens) as ValueExpression<any>;
            const paramToken = tokens[param.index];
            let params: IExpression[] = [];
            if (paramToken.type === LexicalTokenType.Parenthesis && paramToken.data === ")") {
                param.index++;
                params = createParamsExpression(param, paramToken.childrens);
            }
            return new InstantiationExpression(typeExp.value, params);
    }
    throw new Error(`keyword ${token.data} not supported`);
}
function createOperatorExpression(param: SyntaticParameter, operand: IExpression, operatorToken: ILexicalToken, operand2: IExpression, tokens: ILexicalToken[]) {
    switch (operatorToken.data) {
        case ".":
            const memberName = (operand2 as ParameterExpression).name;
            return new MemberAccessExpression(operand, memberName);
        case "*":
            return MultiplicationExpression.create(operand as any, operand2 as any);
        case "+":
            if (!operand)
                operand = ValueExpression.create(0);
            return AdditionExpression.create(operand, operand2);
        case "-":
            if (!operand)
                operand = ValueExpression.create(0);
            return SubtractionExpression.create(operand, operand2);
        case "/":
            return DivisionExpression.create(operand, operand2);
        case "++":
            if (!operand)
                return LeftIncrementExpression.create(operand2);
            else
                return RightIncrementExpression.create(operand);
        case "--":
            if (!operand)
                return LeftDecrementExpression.create(operand2);
            else
                return RightDecrementExpression.create(operand);
        case "&&":
            return AndExpression.create(operand, operand2);
        case "!=":
            return NotEqualExpression.create(operand, operand2);
        case "!==":
            return StrictNotEqualExpression.create(operand, operand2);
        case "==":
            return EqualExpression.create(operand, operand2);
        case "===":
            return StrictEqualExpression.create(operand, operand2);
        case ">":
            return GreaterThanExpression.create(operand, operand2);
        case ">=":
            return GreaterEqualExpression.Create(operand, operand2);
        case "<":
            return LessThanExpression.create(operand, operand2);
        case "<=":
            return LessEqualExpression.create(operand, operand2);
        case "||":
            return OrExpression.create(operand, operand2);
        case "!":
            return NegationExpression.create(operand2);
        case "&":
            return BitwiseAndExpression.create(operand, operand2);
        case "|":
            return BitwiseOrExpression.create(operand, operand2);
        case "~":
            return BitwiseNotExpression.create(operand2);
        case "^":
            return BitwiseXorExpression.create(operand, operand2);
        case "<<":
            return BitwiseZeroLeftShiftExpression.create(operand, operand2);
        case ">>":
            return BitwiseZeroRightShiftExpression.create(operand, operand2);
        case ">>>":
            return BitwiseSignedRightShiftExpression.create(operand, operand2);
        case ">>>":
            return BitwiseOrExpression.create(operand, operand2);
        case ".":
            return MemberAccessExpression.create(operand, operand2);
        case "typeof":
            return TypeofExpression.create(operand2);
        case "instanceof":
            return InstanceofExpression.create(operand, operand2);
    }
    throw new Error(`${operatorToken.data} operator not supported`);
}
function createFunctionExpression(param: SyntaticParameter, params: ParameterExpression[], tokens: ILexicalToken[]) {
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
        if (token.data === "}")
            param.index++;
        body = createParamsExpression(param, token.childrens)[0];
    }
    else {
        body = createExpression(param, tokens);
    }
    for (const paramExp of params) {
        let paramsL = param.scopedParameters.get(paramExp.name);
        paramsL.shift();
    }
    return new FunctionExpression(body, params);
}
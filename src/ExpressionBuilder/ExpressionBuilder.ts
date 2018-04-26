import { IExpression, ParameterExpression, ValueExpression, MemberAccessExpression, MethodCallExpression, RightIncrementExpression, RightDecrementExpression, SubtractionExpression, NegationExpression, BitwiseNotExpression, FunctionExpression, MultiplicationExpression, AdditionExpression, DivisionExpression, LeftIncrementExpression, LeftDecrementExpression, AndExpression, NotEqualExpression, StrictNotEqualExpression, EqualExpression, StrictEqualExpression, GreaterThanExpression, GreaterEqualExpression, LessThanExpression, LessEqualExpression, OrExpression, BitwiseAndExpression, BitwiseOrExpression, BitwiseXorExpression, BitwiseZeroLeftShiftExpression, BitwiseZeroRightShiftExpression, BitwiseSignedRightShiftExpression, TypeofExpression, InstanceofExpression, FunctionCallExpression, ObjectValueExpression, ArrayValueExpression } from "./Expression";
import { GenericType } from "../Common/Type";
import { isNativeFunction } from "../Helper/Util";
import { InstantiationExpression } from "./Expression/InstantiationExpression";

export namespace ExpressionBuilder {
    export function parse<TParam = any, TResult = any>(fn: (...items: TParam[]) => TResult, paramTypes?: GenericType<TParam>[], userParameters?: Map<string, any>) {
        const tokens = analyzeLexical(fn.toString());
        return analyzeSyntatic(tokens, paramTypes, userParameters) as FunctionExpression<TParam, TResult>;
    }
    /**
     * Lexical Analizer / Tokenizer
     */
    interface ILexicalPointer {
        index: number;
    }
    enum LexicalTokenType {
        Identifier,
        String,
        Number,
        Keyword,
        Operator,
        Function,
        Parenthesis,
        Breaker
    }
    interface ILexicalToken {
        data: string | number;
        type: LexicalTokenType;
        childrens?: ILexicalToken[];
    }
    const keywordOperator = ["typeof", "instanceof"];
    const keywords = ["abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum", "eval", "export", "extends", "false", "final", "finally", "for", "function", "goto", "if", "implements", "import", "in", "interface", "let", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "var", "void", "volatile", "while", "with", "yield"];
    function analyzeLexical(fnBody: string): ILexicalToken[] {
        const pointer = {
            index: -1
        };
        const result = analyzeLexicalParenthesis(pointer, fnBody);
        return result.childrens;
    }
    function analyzeLexicalIdentifier(pointer: ILexicalPointer, input: string): ILexicalToken {
        const start = pointer.index;
        let char: string;
        do {
            pointer.index++;
            char = input[pointer.index];
        } while (
            (char >= "A" && char <= "Z") || (char >= "a" && char <= "z") ||
            (char >= "0" && char <= "9") || char === "_" || char === "$");

        const data = input.slice(start, pointer.index);
        let type;

        // TODO: Binary search
        for (const keyword of keywordOperator) {
            if (keyword === data) {
                type = LexicalTokenType.Operator;
                break;
            }
        }
        if (!type) {
            for (const keyword of keywords) {
                if (keyword === data) {
                    type = LexicalTokenType.Keyword;
                    break;
                }
            }
        }
        if (!type) type = LexicalTokenType.Identifier;

        return {
            data: data,
            type: type
        };
    }
    function analyzeLexicalString(pointer: ILexicalPointer, input: string): ILexicalToken {
        const start = pointer.index;
        const stopper = input[start];
        let char: string;
        do {
            char = input[++pointer.index];
            if (char === "\\")
                pointer.index++;
        } while (char !== stopper);
        const data = input.slice(start + 1, pointer.index);
        pointer.index++;
        return {
            data: data,
            type: LexicalTokenType.String
        };
    }
    function analyzeLexicalTemplateLiteral(pointer: ILexicalPointer, input: string): ILexicalToken {
        return analyzeLexicalString(pointer, input);
    }
    function analyzeLexicalNumber(pointer: ILexicalPointer, input: string): ILexicalToken {
        const start = pointer.index;
        let char: string;
        do {
            pointer.index++;
            char = input[pointer.index];
        } while ((char >= "0" && char <= "9") || char === ".");
        const data = input.slice(start, pointer.index);
        return {
            data: data,
            type: LexicalTokenType.Number
        };
    }
    function analyzeLexicalComment(pointer: ILexicalPointer, input: string, isBlock = false) {
        pointer.index++;
        let char: string;
        do {
            char = input[pointer.index++];
            if (isBlock) {
                if (char === "*") {
                    char = input[++pointer.index];
                    if (char === "/")
                        break;
                }
            }
            if (char === "\n")
                break;
        } while (true);
    }
    function analizeLexicalOperator(pointer: ILexicalPointer, input: string): ILexicalToken {
        const start = pointer.index;
        let char: string;
        do {
            pointer.index++;
            char = input[pointer.index];
        } while (char === "=" || char === "+" || char === "-" || char === "&" || char === "|" || char === ">" || char === "<");
        const data = input.slice(start, pointer.index);
        return {
            data: data,
            type: LexicalTokenType.Operator
        };
    }
    function analyzeLexicalParenthesis(pointer: ILexicalPointer, input: string, stopper?: string): ILexicalToken {
        const resultData: ILexicalToken[] = [];
        const length = input.length;
        pointer.index++;
        let char: string;
        do {
            char = input[pointer.index];

            if (char <= " ") {
                pointer.index++;
                continue;
            }
            else if ((char >= "A" && char <= "Z") || (char >= "a" && char <= "z")
                || char === "_" || char === "$") {
                resultData.push(analyzeLexicalIdentifier(pointer, input));
            }
            else if ((char !== "," && char >= "*" && char < "/") || (char >= "<" && char <= "?")
                || char === "&" || char === "|" || char === "~" || char === "^" || char === "!") {
                resultData.push(analizeLexicalOperator(pointer, input));
            }
            else if (char === "'" || char === "\"") {
                resultData.push(analyzeLexicalString(pointer, input));
            }
            else if (char >= "0" && char <= "9") {
                resultData.push(analyzeLexicalNumber(pointer, input));
            }
            else if (char === "(") {
                resultData.push(analyzeLexicalParenthesis(pointer, input, ")"));
            }
            else if (char === "[") {
                resultData.push(analyzeLexicalParenthesis(pointer, input, "]"));
            }
            else if (char === "{") {
                resultData.push(analyzeLexicalParenthesis(pointer, input, "}"));
            }
            else if (char === "`") {
                resultData.push(analyzeLexicalTemplateLiteral(pointer, input));
            }
            else if (char === "\n" || char === ";" || char === ":" || char === ",") {
                resultData.push({
                    data: char,
                    type: LexicalTokenType.Breaker
                });
                pointer.index++;
            }
            else if (char === "/") {
                const char2 = input[pointer.index + 1];
                if (char2 === "*") {
                    analyzeLexicalComment(pointer, input, true);
                }
                else if (char2 === "/") {
                    analyzeLexicalComment(pointer, input, false);
                }
                // TODO: check regex
                // else if (resultData.length <= 0 || resultData[resultData.length - 1].type !== LexicalTokenType.Operator) {
                //     throw new Error("Regex not supported");
                // }
                else {
                    resultData.push(analizeLexicalOperator(pointer, input));
                }
            }
            else if (char === stopper) {
                pointer.index++;
                break;
            }
        } while (pointer.index < length);

        return {
            data: stopper,
            type: LexicalTokenType.Parenthesis,
            childrens: resultData
        };
    }

    /**
     * Syntactic Analizer / Parser
     */
    const operatorRankMap = new Map([
        [".", 10],
        ["++", 9],
        ["--", 9],
        ["!", 9],
        ["~", 9],
        ["-", 6],
        ["?", 4],
        ["+", 6],
        ["*", 7],
        ["/", 7],
        ["%", 7],
        ["===", 4],
        ["!==", 4],
        [">==", 4],
        ["<==", 4],
        ["==", 4],
        ["!=", 4],
        [">=", 4],
        ["<=", 4],
        [">", 4],
        ["<", 4],
        ["&&", 2],
        ["||", 2],
        ["&", 2],
        ["|", 2],
        ["^", 2],
        ["<<", 2],
        [">>", 2],
        [">>>", 2],
        ["instanceof", 2],
        ["typeof", 8],
    ]);
    interface SyntaticParameter {
        index: number;
        types: GenericType[];
        scopedParameters: Map<string, ParameterExpression[]>;
        userParameters: Map<string, any>;
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
    ]);
    function analyzeSyntatic(tokens: ILexicalToken[], paramTypes: GenericType[] = [], userParameters = new Map<string, any>()) {
        const param: SyntaticParameter = {
            index: 0,
            types: paramTypes,
            scopedParameters: new Map(),
            userParameters: new Map()
        };
        const result = createExpression(param, tokens);
        return result;
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
                        const rank = operatorRankMap.get(token.data as string);
                        if (prevOperatorRank >= rank)
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
                case LexicalTokenType.String:
                case LexicalTokenType.Identifier: {
                    expression = createOperandExpression(param, token, tokens);
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
    function createOperandExpression(param: SyntaticParameter, token: ILexicalToken, tokens: ILexicalToken[]): IExpression {
        switch (token.type) {
            case LexicalTokenType.Identifier:
                if (param.scopedParameters.has(token.data as string)) {
                    const params = param.scopedParameters.get(token.data as string);
                    if (params.length > 0)
                        return params[0];
                }
                else if (param.userParameters.has(token.data as string)) {
                    const data = param.userParameters.get(token.data as string);
                    if (data instanceof Function) {
                        const paramToken = tokens[++param.index];
                        const params = createParamsExpression(param, paramToken.data as any);
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
            case LexicalTokenType.String:
                return new ValueExpression(token.data as string);
            case LexicalTokenType.Function:
                const paramToken = tokens[++param.index];
                const params = createParamsExpression(param, paramToken.data as any);
                return FunctionCallExpression.Create(null, params, token.data as string);
            case LexicalTokenType.Number:
                return new ValueExpression(Number.parseFloat(token.data as string));
        }
        throw new Error("asd");
    }
    function createKeywordExpression(param: SyntaticParameter, token: ILexicalToken, tokens: ILexicalToken[]): IExpression {
        switch (token.data) {
            case "new":
                const typeExp = createOperandExpression(param, tokens[param.index++], tokens) as ValueExpression<any>;
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
}
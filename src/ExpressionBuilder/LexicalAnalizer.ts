import { operators } from "./IOperator";
import { Enumerable } from "../Enumerable/Enumerable";

interface ILexicalPointer {
    index: number;
}
export enum LexicalTokenType {
    Identifier,
    String,
    Number,
    Regexp,
    Keyword,
    Operator,
    Parenthesis,
    Breaker
}
export interface ILexicalToken {
    data: string | number;
    type: LexicalTokenType;
    childrens?: ILexicalToken[];
}
export class LexicalAnalizer {
    public static parse(fnBody: string): ILexicalToken[] {
        const pointer: ILexicalPointer = {
            index: -1
        };
        const result = analyzeLexicalParenthesis(pointer, fnBody);
        return result.childrens;
    }
}

const keywordOperator = new Enumerable(operators.keys()).where(o => o[0] >= "a" && o[0] <= "z").toArray();
const keywords = ["abstract", "arguments", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default", "do", "double", "else", "enum", "eval", "export", "extends", "final", "finally", "for", "goto", "if", "implements", "import", "interface", "let", "long", "native", "package", "private", "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "var", "volatile", "while", "with"];

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
function analyzeRegexp(pointer: ILexicalPointer, input: string): ILexicalToken {
    const start = pointer.index;
    let isFoundEnd = false;
    let char: string;
    do {
        if (!isFoundEnd)
            isFoundEnd = char === "/";
        char = input[++pointer.index];
        if (char === "\\")
            char = input[pointer.index += 2];
    } while (!isFoundEnd || char === "i" || char === "g" || char === "m" || char === "u" || char === "y");
    const data = input.slice(start, pointer.index);
    return {
        data: data,
        type: LexicalTokenType.Regexp
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
    let char = input[++pointer.index];
    if (["=", "+", "-", "*", "&", "|", ">", "<"].indexOf(char)) {
        char = input[++pointer.index];
        if (["=", ">"].indexOf(char)) {
            pointer.index++;
        }
    }
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
            else {
                const lastToken = resultData[resultData.length - 1];
                if (!lastToken || lastToken.type > LexicalTokenType.Regexp) {
                    resultData.push(analyzeRegexp(pointer, input));
                }
                else {
                    resultData.push(analizeLexicalOperator(pointer, input));
                }
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

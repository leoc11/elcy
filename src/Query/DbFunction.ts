import { CodedError } from "../Error/CodedError";

function toRegExp(pattern: string, escape: string = "\\") {
    let regexStr = "^";
    for (let i = 0, len = pattern.length; i < len; i++) {
        let char = pattern[i];
        switch (char) {
            case escape:
                char = pattern[++i];
                break;
            case "%":
                regexStr += ".*";
                continue;
            case "_":
                regexStr += ".";
                continue;
        }
        switch (char) {
            case "^":
            case "*":
            case ".":
            case "[":
            case "]":
            case "?":
            case "$":
            case "+":
            case "(":
            case ")":
            case "{":
            case "}":
            case "\\":
                regexStr += "\\" + char;
                break;
            default:
                regexStr += char;
        }
    }

    return new RegExp(regexStr + "$");
}

class DbFunctionConstruct {
    public lastInsertedId(): any {
        throw new CodedError(1, "Unsupported operation");
    }
    public coalesce<T>(...items: T[]): T {
        return items.first((o) => o !== undefined && o !== null);
    }
    public like(input: string, pattern: string, escape = "\\"): boolean {
        const regex = toRegExp(pattern || "", escape);
        return regex.test(input);
    }
    public timestamp() {
        return new Date();
    }
    public utcTimestamp() {
        const ts = new Date();
        return ts.toUTCDate();
    };
}
export const DbFunction = new DbFunctionConstruct();
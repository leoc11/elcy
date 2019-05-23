
// tslint:disable-next-line:interface-name
interface String {
    like(pattern: string): boolean;
}

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
String.prototype.like = function(this: string, pattern: string, escape = "\\") {
    const regex = toRegExp(pattern || "", escape);
    return regex.test(this);
};

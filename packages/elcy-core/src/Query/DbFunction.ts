import { ObjectLike } from "src/Common/Type";
import { CodedError } from "../Error/CodedError";
import { TimeSpan } from "src/Data/TimeSpan";
import { DateExtension } from "src/Extensions/DateExtension";

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
    public like(input: string, pattern: string, escape = "\\"): boolean {
        const regex = toRegExp(pattern || "", escape);
        return regex.test(input);
    }
    public timestamp() {
        return new Date();
    }
    public utcTimestamp() {
        return DateExtension.getUTCDate(new Date());
    }
    public dateAdd(date: Date, durationLike: ObjectLike<Record<"years" | "months" | "days" | "hours" | "minutes" | "seconds" | "milliseconds", number>>) {
        const result = new Date(date.getTime());
        if (durationLike.years) {
            result.setFullYear(result.getFullYear() + durationLike.years);
        }
        if (durationLike.months) {
            result.setMonth(result.getMonth() + durationLike.months);
        }
        if (durationLike.days) {
            result.setDate(result.getDate() + durationLike.days);
        }
        if (durationLike.hours) {
            result.setHours(result.getHours() + durationLike.hours);
        }
        if (durationLike.minutes) {
            result.setMinutes(result.getMinutes() + durationLike.minutes);
        }
        if (durationLike.seconds) {
            result.setSeconds(result.getSeconds() + durationLike.seconds);
        }
        if (durationLike.milliseconds) {
            result.setMilliseconds(result.getMilliseconds() + durationLike.milliseconds);
        }

        return result;
    }
    public getTime(date: Date) {
        return new TimeSpan(date);
    }
    public getDate(date: Date) {
        const dat = new Date(date.getTime());
        dat.setHours(0, 0, 0, 0);
        return dat;
    }
}
export const DbFunction = new DbFunctionConstruct();
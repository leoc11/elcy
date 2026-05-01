import { fillZero } from "../Helper/Util";

export const DateExtension = {
    getUTCDate(date: Date) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    },
    fromUTCDate(date: Date) {
        return new Date(`${date.getFullYear()}-${fillZero(date.getMonth() + 1)}-${fillZero(date.getDate())}T${fillZero(date.getHours())}:${fillZero(date.getMinutes())}:${fillZero(date.getSeconds())}.${fillZero(date.getMilliseconds(), 3)}Z`);
    }
};
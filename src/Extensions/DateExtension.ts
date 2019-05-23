import { TimeSpan } from "../Data/TimeSpan";
import { fillZero } from "../Helper/Util";

declare global {
    interface Date {
        addDays(days: number): Date;
        addMonths(months: number): Date;
        addYears(days: number): Date;
        addHours(days: number): Date;
        addMinutes(days: number): Date;
        addSeconds(days: number): Date;
        addMilliseconds(days: number): Date;
        toDate(): Date;
        toTime(): TimeSpan;
        toUTCDate(): Date;
        fromUTCDate(): Date;
    }
    interface DateConstructor {
        timestamp(): Date;
        utcTimestamp(): Date;
    }
}

Date.timestamp = function() {
    return new Date();
};
Date.utcTimestamp = function() {
    const ts = new Date();
    return ts.toUTCDate();
};
Date.prototype.toUTCDate = function(this: Date) {
    return new Date(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds(), this.getUTCMilliseconds());
};
Date.prototype.fromUTCDate = function(this: Date) {
    return new Date(`${this.getFullYear()}-${fillZero(this.getMonth() + 1)}-${fillZero(this.getDate())}T${fillZero(this.getHours())}:${fillZero(this.getMinutes())}:${fillZero(this.getSeconds())}.${fillZero(this.getMilliseconds(), 3)}Z`);
};
Date.prototype.addDays = function(days: number): Date {
    const dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};

Date.prototype.addMonths = function(months: number): Date {
    const dat = new Date(this.valueOf());
    dat.setMonth(dat.getMonth() + months);
    return dat;
};

Date.prototype.addYears = function(years: number): Date {
    const dat = new Date(this.valueOf());
    dat.setFullYear(dat.getFullYear() + years);
    return dat;
};

Date.prototype.addHours = function(hours: number): Date {
    const dat = new Date(this.valueOf());
    dat.setHours(dat.getHours() + hours);
    return dat;
};

Date.prototype.addMinutes = function(minutes: number): Date {
    const dat = new Date(this.valueOf());
    dat.setMinutes(dat.getMinutes() + minutes);
    return dat;
};

Date.prototype.addSeconds = function(seconds: number): Date {
    const dat = new Date(this.valueOf());
    dat.setSeconds(dat.getSeconds() + seconds);
    return dat;
};

Date.prototype.addMilliseconds = function(milliSeconds: number): Date {
    const dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + milliSeconds);
    return dat;
};

Date.prototype.toDate = function(): Date {
    const dat = new Date(this.valueOf());
    dat.setHours(0);
    dat.setMinutes(0);
    dat.setSeconds(0);
    dat.setMilliseconds(0);
    return dat;
};

Date.prototype.toTime = function(this: Date): TimeSpan {
    return new TimeSpan(this);
};

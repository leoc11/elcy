import { TimeSpan } from "../Common/TimeSpan";
declare global {
    interface Date {
        addDays(days: number): Date;
        addMonths(months: number): Date;
        addYears(days: number): Date;
        addHours(days: number): Date;
        addMinutes(days: number): Date;
        addSeconds(days: number): Date;
        addMilliSeconds(days: number): Date;
        toDate(): Date;
        toTime(): TimeSpan;
    }
    interface DateConstructor {
        getDate(): Date;
    }
}

Date.getDate = function () {
    return new Date();
};

Date.prototype.addDays = function (days: number): Date {
    const dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};

Date.prototype.addMonths = function (months: number): Date {
    const dat = new Date(this.valueOf());
    dat.setMonth(dat.getMonth() + months);
    return dat;
};

Date.prototype.addYears = function (years: number): Date {
    const dat = new Date(this.valueOf());
    dat.setFullYear(dat.getFullYear() + years);
    return dat;
};

Date.prototype.addHours = function (hours: number): Date {
    const dat = new Date(this.valueOf());
    dat.setHours(dat.getHours() + hours);
    return dat;
};

Date.prototype.addMinutes = function (minutes: number): Date {
    const dat = new Date(this.valueOf());
    dat.setMinutes(dat.getMinutes() + minutes);
    return dat;
};

Date.prototype.addSeconds = function (seconds: number): Date {
    const dat = new Date(this.valueOf());
    dat.setSeconds(dat.getSeconds() + seconds);
    return dat;
};

Date.prototype.addMilliSeconds = function (milliSeconds: number): Date {
    const dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + milliSeconds);
    return dat;
};

Date.prototype.toDate = function (): Date {
    const dat = new Date(this.valueOf());
    dat.setHours(0);
    dat.setMinutes(0);
    dat.setSeconds(0);
    dat.setMilliseconds(0);
    return dat;
};

Date.prototype.toTime = function (this: Date): TimeSpan {
    return new TimeSpan(this);
};

import { fillZero } from "../Helper/Util";

export class TimeSpan {
    private epochMilliSeconds: number;
    constructor(date: Date);
    constructor(epochMilliSeconds: number);
    constructor(hours: number, minutes: number, seconds: number);
    constructor(hours: number | Date, minutes?: number, seconds?: number, milliSeconds?: number) {
        if (hours instanceof Date) {
            this.epochMilliSeconds = hours.getTime();
        }
        else if (arguments.length === 1) {
            this.epochMilliSeconds = hours;
        }
        else {
            this.epochMilliSeconds = hours * 3600000;
            if (minutes) this.epochMilliSeconds += minutes * 60000;
            if (seconds) this.epochMilliSeconds += seconds * 1000;
            if (milliSeconds) this.epochMilliSeconds += milliSeconds;
        }
    }
    public valueOf() {
        return this.epochMilliSeconds;
    }
    public getHours() {
        return Math.floor(this.totalHours()) % 24;
    }
    public getMinutes() {
        return Math.floor(this.totalMinutes()) % 60;
    }
    public getSeconds() {
        return Math.floor(this.totalSeconds()) % 60;
    }
    public getMilliSeconds() {
        return this.totalMilliSeconds() % 1000;
    }
    public setHours(hours: number) {
        return this.epochMilliSeconds += (hours * 3600000);
    }
    public setMinutes(minutes: number) {
        return this.epochMilliSeconds += (minutes * 60000);
    }
    public setSeconds(seconds: number) {
        return this.epochMilliSeconds += (seconds * 1000);
    }
    public setMilliSeconds(milliSeconds: number) {
        return this.epochMilliSeconds += milliSeconds;
    }
    public addHours(hours: number) {
        return new TimeSpan(this.epochMilliSeconds + (hours * 3600000));
    }
    public addMinutes(minutes: number) {
        return new TimeSpan(this.epochMilliSeconds + (minutes * 60000));
    }
    public addSeconds(seconds: number) {
        return new TimeSpan(this.epochMilliSeconds + (seconds * 1000));
    }
    public addMilliSeconds(milliSeconds: number) {
        return new TimeSpan(this.epochMilliSeconds + milliSeconds);
    }
    public totalDays() {
        return this.epochMilliSeconds / 86400000;
    }
    public totalHours() {
        return this.epochMilliSeconds / 3600000;
    }
    public totalMinutes() {
        return this.epochMilliSeconds / 60000;
    }
    public totalSeconds() {
        return this.epochMilliSeconds / 1000;
    }
    public totalMilliSeconds() {
        return this.epochMilliSeconds;
    }
    public toString() {
        const mili = this.getMilliSeconds();
        return fillZero(this.getHours()) + ":" + fillZero(this.getMinutes()) + ":" + fillZero(this.getSeconds()) + (mili > 0 ? "." + fillZero(this.getMilliSeconds(), 3) : "");
    }
    public toJSON() {
        return this.toString();
    }
}

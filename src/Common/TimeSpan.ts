import { fillZero } from "../Helper/Util";

export class TimeSpan {
    constructor(date: Date);
    constructor(timeString: string);
    constructor(epochMilliSeconds: number);
    constructor(hours: number, minutes: number, seconds: number, milliSeconds?: number);
    constructor(hours: number | Date | string, minutes?: number, seconds?: number, milliSeconds?: number) {
        if (hours instanceof Date) {
            milliSeconds = hours.getMilliseconds();
            seconds = hours.getSeconds();
            minutes = hours.getMinutes();
            hours = hours.getHours();
        }
        else if (typeof hours === "string") {
            return TimeSpan.parse(hours);
        }
        else if (arguments.length === 1) {
            this.epochMilliSeconds = hours;
            return;
        }

        this.epochMilliSeconds = hours * 3600000;
        if (minutes) {
            this.epochMilliSeconds += minutes * 60000;
        }
        if (seconds) {
            this.epochMilliSeconds += seconds * 1000;
        }
        if (milliSeconds) {
            this.epochMilliSeconds += milliSeconds;
        }
    }
    public static parse(timeSpan: string) {
        const times = timeSpan.split(":");
        const secondmilis = times[2].split(".");
        const hours = parseInt(times[0], 10);
        const minutes = parseInt(times[1], 10);
        const seconds = parseInt(secondmilis[0], 10);
        const milliSeconds = secondmilis.length > 1 ? parseInt(secondmilis[1], 10) : 0;
        return new TimeSpan(hours, minutes, seconds, milliSeconds);
    }
    private epochMilliSeconds: number;
    public [Symbol.toPrimitive](hint?: "number" | "string" | "default") {
        if (hint === "number") {
            return this.epochMilliSeconds;
        }
        return this.toString();
    }
    public addHours(hours: number) {
        return new TimeSpan(this.epochMilliSeconds + (hours * 3600000));
    }
    public addMilliSeconds(milliSeconds: number) {
        return new TimeSpan(this.epochMilliSeconds + milliSeconds);
    }
    public addMinutes(minutes: number) {
        return new TimeSpan(this.epochMilliSeconds + (minutes * 60000));
    }
    public addSeconds(seconds: number) {
        return new TimeSpan(this.epochMilliSeconds + (seconds * 1000));
    }
    public getHours() {
        return Math.floor(this.totalHours()) % 24;
    }
    public getMilliseconds() {
        return this.totalMilliSeconds() % 1000;
    }
    public getMinutes() {
        return Math.floor(this.totalMinutes()) % 60;
    }
    public getSeconds() {
        return Math.floor(this.totalSeconds()) % 60;
    }
    public setHours(hours: number) {
        return this.epochMilliSeconds += (hours * 3600000);
    }
    public setMilliSeconds(milliSeconds: number) {
        return this.epochMilliSeconds += milliSeconds;
    }
    public setMinutes(minutes: number) {
        return this.epochMilliSeconds += (minutes * 60000);
    }
    public setSeconds(seconds: number) {
        return this.epochMilliSeconds += (seconds * 1000);
    }
    public toJSON() {
        return this.toString();
    }
    public toString() {
        const mili = this.getMilliseconds();
        return fillZero(this.getHours()) + ":" + fillZero(this.getMinutes()) + ":" + fillZero(this.getSeconds()) + (mili > 0 ? "." + fillZero(mili, 3) : "");
    }
    public totalDays() {
        return this.epochMilliSeconds / 86400000;
    }
    public totalHours() {
        return this.epochMilliSeconds / 3600000;
    }
    public totalMilliSeconds() {
        return this.epochMilliSeconds;
    }
    public totalMinutes() {
        return this.epochMilliSeconds / 60000;
    }
    public totalSeconds() {
        return this.epochMilliSeconds / 1000;
    }
    public valueOf() {
        return this.epochMilliSeconds;
    }
}

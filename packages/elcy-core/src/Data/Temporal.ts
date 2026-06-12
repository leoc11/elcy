import type { Temporal as TemporalModule } from "@js-temporal/polyfill";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { ObjectValueExpression } from "src/ExpressionBuilder/Expression/ObjectValueExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { registerTranslationFunction } from "src/Registry/QueryTranslatorRegistry";
import { register } from "src/Registry/GlobalIdentifierRegistry";
import { DateTimeColumnMetaData, TimeColumnMetaData } from "src/MetaData";

let module: typeof import("@js-temporal/polyfill").Temporal;
try {
    module = (await import('@js-temporal/polyfill')).Temporal;
}
catch { }

export const Temporal = module;
export namespace Temporal {
    export type Instant = TemporalModule.Instant;
    export type PlainDate = TemporalModule.PlainDate;
    export type PlainTime = TemporalModule.PlainTime;
    export type PlainDateTime = TemporalModule.PlainDateTime;
    export type DurationLike = TemporalModule.DurationLike;
    export type PlainDateLike = TemporalModule.PlainDateLike;
    export type PlainTimeLike = TemporalModule.PlainTimeLike;
    export type RoundTo<T extends TemporalModule.DateTimeUnit> = TemporalModule.RoundTo<T>;
    export type SmallestUnit<T extends TemporalModule.DateTimeUnit> = TemporalModule.SmallestUnit<T>;
}

declare global {
    interface DateValueTypeRegistry {
        Temporal_PlainDate: Temporal.PlainDate;
    }
    interface TimeValueTypeRegistry {
        Temporal_PlainTime: Temporal.PlainTime;
    }
    interface DateTimeValueTypeRegistry {
        Temporal_Instant: Temporal.Instant;
    }
}

if (Temporal) {
    register("Temporal", Temporal);

    registerTranslationFunction("default", o => {
        /**
         * Temporal.Instant
         * TODO: since, until
         */
        o.registerValueType(Temporal.Instant, {
            columnType: { columnType: "datetime", group: "DateTime" },
            hydrate: (value: string | Date, meta: DateTimeColumnMetaData) => {
                if (value instanceof Date) {
                    const epochMs = meta.timeZoneHandling === "utc" ? value.getTime() : Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());
                    return Temporal.Instant.fromEpochMilliseconds(epochMs);
                }

                return Temporal.Instant.from(value);
            },
            instance: Temporal.Instant.fromEpochMilliseconds(0)
        });
        o.registerValueType(Temporal.PlainDate, {
            columnType: { columnType: "date", group: "Date" },
            hydrate: (value: string | Date) => {
                let option: string | Temporal.PlainDateLike = typeof value === "string" ? value : {
                    year: value.getFullYear(),
                    month: value.getMonth() + 1,
                    day: value.getDate()
                };
                return Temporal.PlainDate.from(option);
            },
            persist: (value) => new Date(value.year, value.month - 1, value.day),
            instance: Temporal.PlainDate.from({ day: 1, month: 1, year: 1970 })
        });
        o.registerValueType(Temporal.PlainTime, {
            columnType: { columnType: "time", group: "Date" },
            hydrate: (value: string | Date, meta: TimeColumnMetaData) => {
                let option: string | Temporal.PlainTimeLike = value instanceof Date ? {
                    hour: meta.timeZoneHandling === "utc" ? value.getUTCHours() : value.getHours(),
                    minute: meta.timeZoneHandling === "utc" ? value.getUTCMinutes() : value.getMinutes(),
                    second: meta.timeZoneHandling === "utc" ? value.getUTCSeconds() : value.getSeconds(),
                    millisecond: meta.timeZoneHandling === "utc" ? value.getUTCMilliseconds() : value.getMilliseconds()
                } : value;

                return Temporal.PlainTime.from(option);
            },
            instance: Temporal.PlainTime.from({ hour: 0 })
        });

        o.registerMethod(Temporal.Instant, "compare", (qb, exp, context) => {
            const param1 = qb.toString(exp.params[0], context);
            const param2 = qb.toString(exp.params[2], context);
            return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
        });
        o.registerMethod(Temporal.PlainDate, "compare", (qb, exp, context) => {
            const param1 = qb.toString(exp.params[0], context);
            const param2 = qb.toString(exp.params[2], context);
            return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
        });
        o.registerMethod(Temporal.PlainTime, "compare", (qb, exp, context) => {
            const param1 = qb.toString(exp.params[0], context);
            const param2 = qb.toString(exp.params[2], context);
            return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
        });

        o.registerMethod(Temporal.Instant, "from", (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as TIMESTAMP WITH TIME ZONE)`);
        o.registerMethod(Temporal.Instant, "fromEpochMilliseconds", (qb, exp, context) => {
            const value = context.parameters.get(exp.params[0] as SqlParameterExpression)?.value as number;
            return `TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00 UTC' + INTERVAL ${qb.toString(new ValueExpression(`${value / 1_000} SECOND`), context)}`;
        });
        o.registerMethod(Temporal.Instant, "fromEpochNanoseconds", (qb, exp, context) => {
            const value = context.parameters.get(exp.params[0] as SqlParameterExpression)?.value as number;
            return `TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00 UTC' + INTERVAL ${qb.toString(new ValueExpression(`${value / 1_000_000} SECOND`), context)}`;
        });
        o.registerMember(Temporal.Instant.prototype, "epochMilliseconds", (qb, exp, context) => `CAST((${qb.toString(exp.objectOperand, context)} - TIMESTAMP '1970-01-01 00:00:00 UTC') DAY TO SECOND AS DECIMAL(20,3)) * 1000`);
        o.registerMember(Temporal.Instant.prototype, "epochNanoseconds", (qb, exp, context) => `CAST((${qb.toString(exp.objectOperand, context)} - TIMESTAMP '1970-01-01 00:00:00 UTC') DAY TO SECOND AS DECIMAL(20,3)) * 1000000000`);

        o.registerMethod(Temporal.Instant.prototype, "toString", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.Instant.prototype, "toJSON", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.Instant.prototype, "toZonedDateTimeISO", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} AT TIME ZONE ${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Temporal.Instant.prototype, "add", (qb, exp, context) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
            const intervalParams = [] as string[];
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, context)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, context)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, context));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, context)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `(${qb.toString(exp.objectOperand, context)} + make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.Instant.prototype, "subtract", (qb, exp, context) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
            const intervalParams = [] as string[];
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, context)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, context)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, context));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, context)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, context)}) - make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.Instant.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)})=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Temporal.Instant.prototype, "round", (qb, exp, context) => {
            let smallestUnitParam: IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>> = undefined;
            if (exp.params[0] instanceof ObjectValueExpression) {
                const paramExp = exp.params[0] as ObjectValueExpression<Exclude<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                if (paramExp.object.roundingMode) {
                    throw new Error(`Temporal.Instant.round: roundingMode not supported`);
                }
                if (paramExp.object.roundingIncrement) {
                    throw new Error(`Temporal.Instant.round: roundingIncrement not supported`);
                }
                if (paramExp.object.smallestUnit) {
                    smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                }
            }
            else {
                smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
            return `DATE_TRUNC(${qb.toString(smallestUnitParam, context)}, ${qb.toString(exp.objectOperand, context)})`;
        });
        o.registerMethod(Temporal.Instant.prototype, "valueOf", (qb, exp, context) => {
            throw new Error(`Temporal.Instant.valueOf: not supported`);
        });


        /**
         * Temporal.PlainDate
         * TODO: since, until, calendarId, dayOfWeek, dayOfYear, daysInMonth, daysInWeek, daysInYear, era, eraYear, inleapYear
         * monthinyear, weekofyear, yearofweek, withCalendar()
         */
        o.registerMethod(Temporal.PlainDate, "from", (qb, exp, context) => `DATE ${qb.toString(exp.params[0], context)}`);

        o.registerMember(Temporal.PlainDate.prototype, "year", (qb, exp, context) => `EXTRACT(YEAR FROM ${qb.toString(exp.objectOperand, context)})`);
        o.registerMember(Temporal.PlainDate.prototype, "month", (qb, exp, context) => `EXTRACT(MONTH FROM ${qb.toString(exp.objectOperand, context)})`);
        o.registerMember(Temporal.PlainDate.prototype, "day", (qb, exp, context) => `EXTRACT(DAY FROM ${qb.toString(exp.objectOperand, context)})`);
        o.registerMember(Temporal.PlainDate.prototype, "monthCode", (qb, exp, context) => `${qb.valueString("M")}`);

        o.registerMethod(Temporal.PlainDate.prototype, "toString", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.PlainDate.prototype, "toJSON", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.PlainDate.prototype, "add", (qb, exp, context) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, context)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, context)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, context)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, context));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, context)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, context)} + make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "subtract", (qb, exp, context) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, context)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, context)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, context)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, context));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, context)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, context)}) - make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)})=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Temporal.PlainDate.prototype, "with", (qb, exp, context) => {
            if (exp.params.length !== 1) {
                throw Error("Temporal.PlainDate.with: only support info");
            }
            const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainDateLike>;
            if (paramInfoExp.object.calendar) {
                throw Error("Temporal.PlainDate.with: calendar not supported");
            }
            if (paramInfoExp.object.era) {
                throw Error("Temporal.PlainDate.with: era not supported");
            }
            if (paramInfoExp.object.eraYear) {
                throw Error("Temporal.PlainDate.with: eraYear not supported");
            }
            if (paramInfoExp.object.monthCode) {
                throw Error("Temporal.PlainDate.with: monthCode not supported");
            }
            const objectQ = qb.toString(exp.objectOperand, context);
            let yearQ = `EXTRACT(YEAR FROM ${objectQ})`;
            if (paramInfoExp.object.year) {
                yearQ = `COALESCE(${qb.toString(paramInfoExp.object.year, context)}, ${yearQ})`;
            }
            let monthQ = `EXTRACT(MONTH FROM ${objectQ})`;
            if (paramInfoExp.object.month) {
                monthQ = `COALESCE(${qb.toString(paramInfoExp.object.month, context)}, ${monthQ})`;
            }
            let dayQ = `EXTRACT(DAY FROM ${objectQ})`;
            if (paramInfoExp.object.day) {
                dayQ = `COALESCE(${qb.toString(paramInfoExp.object.day, context)}, ${dayQ})`;
            }

            return `MAKE_DATE(CAST(${yearQ} as int), CAST(${monthQ} as int), CAST(${dayQ} as int))`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, context) => {
            throw new Error(`Temporal.PlainDate.valueOf: not supported`);
        });


        /**
         * Temporal.PlainTime
         * TODO: since, until
         */
        o.registerMethod(Temporal.PlainTime, "from", (qb, exp, context) => `TIME ${qb.toString(exp.params[0], context)}`);

        o.registerMember(Temporal.PlainTime.prototype, "hour", (qb, exp, context) => `EXTRACT(HOUR FROM ${qb.toString(exp.objectOperand, context)})`);
        o.registerMember(Temporal.PlainTime.prototype, "minute", (qb, exp, context) => `EXTRACT(MINUTE FROM ${qb.toString(exp.objectOperand, context)})`);
        o.registerMember(Temporal.PlainTime.prototype, "second", (qb, exp, context) => `EXTRACT(SECOND FROM ${qb.toString(exp.objectOperand, context)})`);
        o.registerMember(Temporal.PlainTime.prototype, "millisecond", (qb, exp, context) => `FLOOR(EXTRACT(MILLISECOND FROM ${qb.toString(exp.objectOperand, context)}))`);
        o.registerMember(Temporal.PlainTime.prototype, "microsecond", (qb, exp, context) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, context)}))`);
        o.registerMember(Temporal.PlainTime.prototype, "nanosecond", (qb, exp, context) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, context)})* 1000)`);

        o.registerMethod(Temporal.PlainTime.prototype, "toString", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'HH24:MI:SS.US')`);
        o.registerMethod(Temporal.PlainTime.prototype, "toJSON", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'HH24:MI:SS.US')`);
        o.registerMethod(Temporal.PlainTime.prototype, "add", (qb, exp, context) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, context)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, context)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, context)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, context));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, context)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, context)} + make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainTime.prototype, "subtract", (qb, exp, context) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, context)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, context)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, context)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, context));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, context)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, context)}) - make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainTime.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)})=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Temporal.PlainTime.prototype, "with", (qb, exp, context) => {
            if (exp.params.length !== 1) {
                throw Error("Temporal.PlainDate.with: only support info");
            }
            const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainTimeLike>;
            const objectQ = qb.toString(exp.objectOperand, context);
            let hourQ = `EXTRACT(HOUR FROM ${objectQ})`;
            if (paramInfoExp.object.hour) {
                hourQ = `COALESCE(${qb.toString(paramInfoExp.object.hour, context)}, ${hourQ})`;
            }
            let minuteQ = `EXTRACT(MINUTE FROM ${objectQ})`;
            if (paramInfoExp.object.minute) {
                minuteQ = `COALESCE(${qb.toString(paramInfoExp.object.minute, context)}, ${minuteQ})`;
            }
            let secondQ = `EXTRACT(SECOND FROM ${objectQ})`;
            const secondParts = [] as string[];
            if (paramInfoExp.object.second) {
                secondParts.push(qb.toString(paramInfoExp.object.second, context));
            }
            if (paramInfoExp.object.millisecond) {
                secondParts.push(`${qb.toString(paramInfoExp.object.second, context)}/1000.0`);
            }
            if (paramInfoExp.object.microsecond) {
                secondParts.push(`${qb.toString(paramInfoExp.object.second, context)}/1000000.0`);
            }
            if (paramInfoExp.object.nanosecond) {
                secondParts.push(`${qb.toString(paramInfoExp.object.second, context)}/1000000000.0`);
            }
            if (secondParts.length) {
                secondQ = `COALESCE(${secondParts.join("+")}, ${secondQ})`;
            }

            return `MAKE_TIME(CAST(${hourQ} as int), CAST(${minuteQ} as int), ${secondQ})`;
        });
        o.registerMethod(Temporal.PlainTime.prototype, "round", (qb, exp, context) => {
            let smallestUnitParam: IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>> = undefined;
            if (exp.params[0] instanceof ObjectValueExpression) {
                const paramExp = exp.params[0] as ObjectValueExpression<Exclude<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                if (paramExp.object.roundingMode) {
                    throw new Error(`Temporal.PlainTime.round: roundingMode not supported`);
                }
                if (paramExp.object.roundingIncrement) {
                    throw new Error(`Temporal.PlainTime.round: roundingIncrement not supported`);
                }
                if (paramExp.object.smallestUnit) {
                    smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                }
            }
            else {
                smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
            return `DATE_TRUNC(${qb.toString(smallestUnitParam, context)}, ${qb.toString(exp.objectOperand, context)})`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, context) => {
            throw new Error(`Temporal.PlainDate.valueOf: not supported`);
        });


        /**
         * Temporal.Now
         * TODO: timeZoneId()
         */
        o.registerMethod(Temporal.Now, "instant", (qb, exp, context) => `CURRENT_TIMESTAMP`);
        o.registerMethod(Temporal.Now, "plainDateISO", (qb, exp, context) => {
            if (!exp.params.length) {
                return `CURRENT_DATE`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)} as DATE)`;
        });
        o.registerMethod(Temporal.Now, "plainDateTimeISO", (qb, exp, context) => {
            if (!exp.params.length) {
                return `CAST(CURRENT_TIMESTAMP as TIMESTAMP)`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)} as TIMESTAMP)`;
        });
        o.registerMethod(Temporal.Now, "plainTimeISO", (qb, exp, context) => {
            if (!exp.params.length) {
                return `CURRENT_TIME`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)} as TIME)`;
        });
        o.registerMethod(Temporal.Now, "zonedDateTimeISO", (qb, exp, context) => {
            if (!exp.params.length) {
                return `CURRENT_TIMESTAMP`;
            }

            return `CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)}`;
        });
    });
    registerTranslationFunction("mssql", o => {
        o.registerValueType(Temporal.Instant, { columnType: { columnType: "datetime2", group: "DateTime" } });

        o.registerMethod(Temporal.Instant.prototype, "add", (qb, exp, context) => {
            let dateExp = qb.toString(exp.objectOperand, context);
            const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
            if (paramExp.object.milliseconds) {
                dateExp = `DATEADD(MILLISECOND, ${qb.toString(paramExp.object.milliseconds, context)}, ${dateExp})`;
            }
            if (paramExp.object.seconds) {
                dateExp = `DATEADD(SECOND, ${qb.toString(paramExp.object.seconds, context)}, ${dateExp})`;
            }
            if (paramExp.object.minutes) {
                dateExp = `DATEADD(MINUTE, ${qb.toString(paramExp.object.minutes, context)}, ${dateExp})`;
            }
            if (paramExp.object.hours) {
                dateExp = `DATEADD(HOUR, ${qb.toString(paramExp.object.hours, context)}, ${dateExp})`;
            }
            return dateExp;
        });

        o.registerMember(Temporal.PlainDate.prototype, "year", (qb, exp, param) => `YEAR(${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainDate.prototype, "month", (qb, exp, param) => `MONTH(${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainDate.prototype, "day", (qb, exp, param) => `DAY(${qb.toString(exp.objectOperand, param)})`);

        o.registerMethod(Temporal.PlainDate.prototype, "with", (qb, exp, param) => {
            if (exp.params.length !== 1) {
                throw Error("Temporal.PlainDate.with: only support info");
            }
            const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainDateLike>;
            if (paramInfoExp.object.calendar) {
                throw Error("Temporal.PlainDate.with: calendar not supported");
            }
            if (paramInfoExp.object.era) {
                throw Error("Temporal.PlainDate.with: era not supported");
            }
            if (paramInfoExp.object.eraYear) {
                throw Error("Temporal.PlainDate.with: eraYear not supported");
            }
            if (paramInfoExp.object.monthCode) {
                throw Error("Temporal.PlainDate.with: monthCode not supported");
            }
            const objectQ = qb.toString(exp.objectOperand, param);
            let yearQ = `YEAR(${objectQ})`;
            if (paramInfoExp.object.year) {
                yearQ = `COALESCE(${qb.toString(paramInfoExp.object.year, param)}, ${yearQ})`;
            }
            let monthQ = `MONTH(${objectQ})`;
            if (paramInfoExp.object.month) {
                monthQ = `COALESCE(${qb.toString(paramInfoExp.object.month, param)}, ${monthQ})`;
            }
            let dayQ = `DAY(${objectQ})`;
            if (paramInfoExp.object.day) {
                dayQ = `COALESCE(${qb.toString(paramInfoExp.object.day, param)}, ${dayQ})`;
            }

            return `DATEFROMPARTS(CAST(${yearQ} as int), CAST(${monthQ} as int), CAST(${dayQ} as int))`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "add", (qb, exp, context) => {
            let dateExp = qb.toString(exp.objectOperand, context);
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            if (paramExp.object.milliseconds) {
                dateExp = `DATEADD(MILLISECOND, ${qb.toString(paramExp.object.milliseconds, context)}, ${dateExp})`;
            }
            if (paramExp.object.seconds) {
                dateExp = `DATEADD(SECOND, ${qb.toString(paramExp.object.seconds, context)}, ${dateExp})`;
            }
            if (paramExp.object.minutes) {
                dateExp = `DATEADD(MINUTE, ${qb.toString(paramExp.object.minutes, context)}, ${dateExp})`;
            }
            if (paramExp.object.hours) {
                dateExp = `DATEADD(HOUR, ${qb.toString(paramExp.object.hours, context)}, ${dateExp})`;
            }
            if (paramExp.object.days) {
                dateExp = `DATEADD(DAY, ${qb.toString(paramExp.object.days, context)}, ${dateExp})`;
            }
            if (paramExp.object.weeks) {
                dateExp = `DATEADD(WEEK, ${qb.toString(paramExp.object.weeks, context)}, ${dateExp})`;
            }
            if (paramExp.object.months) {
                dateExp = `DATEADD(MONTH, ${qb.toString(paramExp.object.months, context)}, ${dateExp})`;
            }
            if (paramExp.object.years) {
                dateExp = `DATEADD(YYYY, ${qb.toString(paramExp.object.years, context)}, ${dateExp})`;
            }
            return dateExp;
        });
        o.registerMethod(Temporal.PlainTime.prototype, "add", (qb, exp, context) => {
            let dateExp = qb.toString(exp.objectOperand, context);
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            if (paramExp.object.milliseconds) {
                dateExp = `DATEADD(MILLISECOND, ${qb.toString(paramExp.object.milliseconds, context)}, ${dateExp})`;
            }
            if (paramExp.object.seconds) {
                dateExp = `DATEADD(SECOND, ${qb.toString(paramExp.object.seconds, context)}, ${dateExp})`;
            }
            if (paramExp.object.minutes) {
                dateExp = `DATEADD(MINUTE, ${qb.toString(paramExp.object.minutes, context)}, ${dateExp})`;
            }
            if (paramExp.object.hours) {
                dateExp = `DATEADD(HOUR, ${qb.toString(paramExp.object.hours, context)}, ${dateExp})`;
            }
            if (paramExp.object.days) {
                dateExp = `DATEADD(DAY, ${qb.toString(paramExp.object.days, context)}, ${dateExp})`;
            }
            if (paramExp.object.weeks) {
                dateExp = `DATEADD(WEEK, ${qb.toString(paramExp.object.weeks, context)}, ${dateExp})`;
            }
            if (paramExp.object.months) {
                dateExp = `DATEADD(MONTH, ${qb.toString(paramExp.object.months, context)}, ${dateExp})`;
            }
            if (paramExp.object.years) {
                dateExp = `DATEADD(YYYY, ${qb.toString(paramExp.object.years, context)}, ${dateExp})`;
            }
            return dateExp;
        });
    });
    registerTranslationFunction("postgresql", o => {
        /**
         * Temporal.Instant
         * TODO: since, until
         */
        o.registerMethod(Temporal.Instant, "from", (qb, exp, param) => `TIMESTAMPTZ ${qb.toString(exp.params[0], param)}`);
        o.registerMethod(Temporal.Instant, "fromEpochMilliseconds", (qb, exp, param) => `to_timestamp(${qb.toString(exp.params[0], param)}/1000.0)`);
        o.registerMethod(Temporal.Instant, "fromEpochNanoseconds", (qb, exp, param) => `to_timestamp(${qb.toString(exp.params[0], param)}/1000000000.0)`);

        o.registerMember(Temporal.Instant.prototype, "epochMilliseconds", (qb, exp, param) => `EXTRACT(EPOCH FROM ${qb.toString(exp.objectOperand, param)}) * 1000`);
        o.registerMember(Temporal.Instant.prototype, "epochNanoseconds", (qb, exp, param) => `EXTRACT(EPOCH FROM ${qb.toString(exp.objectOperand, param)}) * 1000000000`);

        o.registerMethod(Temporal.Instant.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.Instant.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.Instant.prototype, "toZonedDateTimeISO", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} AT TIME ZONE ${qb.toString(exp.params[0], param)}`);
        o.registerMethod(Temporal.Instant.prototype, "add", (qb, exp, param) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
            const intervalParams = [] as string[];
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, param));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, param)}) + make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.Instant.prototype, "subtract", (qb, exp, param) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
            const intervalParams = [] as string[];
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, param));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, param)}) - make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.Instant.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
        o.registerMethod(Temporal.Instant.prototype, "round", (qb, exp, param) => {
            let smallestUnitParam: IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>> = undefined;
            if (exp.params[0] instanceof ObjectValueExpression) {
                const paramExp = exp.params[0] as ObjectValueExpression<Exclude<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                if (paramExp.object.roundingMode) {
                    throw new Error(`Temporal.Instant.round: roundingMode not supported`);
                }
                if (paramExp.object.roundingIncrement) {
                    throw new Error(`Temporal.Instant.round: roundingIncrement not supported`);
                }
                if (paramExp.object.smallestUnit) {
                    smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                }
            }
            else {
                smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
            return `DATE_TRUNC(${qb.toString(smallestUnitParam, param)}, ${qb.toString(exp.objectOperand, param)})`;
        });
        o.registerMethod(Temporal.Instant.prototype, "valueOf", (qb, exp, param) => {
            throw new Error(`Temporal.Instant.valueOf: not supported`);
        });


        /**
         * Temporal.PlainDate
         * TODO: since, until, calendarId, dayOfWeek, dayOfYear, daysInMonth, daysInWeek, daysInYear, era, eraYear, inleapYear
         * monthinyear, weekofyear, yearofweek, withCalendar()
         */
        o.registerMethod(Temporal.PlainDate, "from", (qb, exp, param) => `DATE ${qb.toString(exp.params[0], param)}`);

        o.registerMember(Temporal.PlainDate.prototype, "year", (qb, exp, param) => `EXTRACT(YEAR FROM ${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainDate.prototype, "month", (qb, exp, param) => `EXTRACT(MONTH FROM ${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainDate.prototype, "day", (qb, exp, param) => `EXTRACT(DAY FROM ${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainDate.prototype, "monthCode", (qb, exp, param) => `${qb.valueString("M")}`);

        o.registerMethod(Temporal.PlainDate.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.PlainDate.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        o.registerMethod(Temporal.PlainDate.prototype, "add", (qb, exp, param) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, param));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, param)}) + make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "subtract", (qb, exp, param) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, param));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, param)}) - make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
        o.registerMethod(Temporal.PlainDate.prototype, "with", (qb, exp, param) => {
            if (exp.params.length !== 1) {
                throw Error("Temporal.PlainDate.with: only support info");
            }
            const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainDateLike>;
            if (paramInfoExp.object.calendar) {
                throw Error("Temporal.PlainDate.with: calendar not supported");
            }
            if (paramInfoExp.object.era) {
                throw Error("Temporal.PlainDate.with: era not supported");
            }
            if (paramInfoExp.object.eraYear) {
                throw Error("Temporal.PlainDate.with: eraYear not supported");
            }
            if (paramInfoExp.object.monthCode) {
                throw Error("Temporal.PlainDate.with: monthCode not supported");
            }
            const objectQ = qb.toString(exp.objectOperand, param);
            let yearQ = `EXTRACT(YEAR FROM ${objectQ})`;
            if (paramInfoExp.object.year) {
                yearQ = `COALESCE(${qb.toString(paramInfoExp.object.year, param)}, ${yearQ})`;
            }
            let monthQ = `EXTRACT(MONTH FROM ${objectQ})`;
            if (paramInfoExp.object.month) {
                monthQ = `COALESCE(${qb.toString(paramInfoExp.object.month, param)}, ${monthQ})`;
            }
            let dayQ = `EXTRACT(DAY FROM ${objectQ})`;
            if (paramInfoExp.object.day) {
                dayQ = `COALESCE(${qb.toString(paramInfoExp.object.day, param)}, ${dayQ})`;
            }

            return `MAKE_DATE(CAST(${yearQ} as int), CAST(${monthQ} as int), CAST(${dayQ} as int))`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, param) => {
            throw new Error(`Temporal.PlainDate.valueOf: not supported`);
        });


        /**
         * Temporal.PlainTime
         * TODO: since, until
         */
        o.registerMethod(Temporal.PlainTime, "from", (qb, exp, param) => `TIME ${qb.toString(exp.params[0], param)}`);

        o.registerMember(Temporal.PlainTime.prototype, "hour", (qb, exp, param) => `EXTRACT(HOUR FROM ${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainTime.prototype, "minute", (qb, exp, param) => `EXTRACT(MINUTE FROM ${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainTime.prototype, "second", (qb, exp, param) => `EXTRACT(SECOND FROM ${qb.toString(exp.objectOperand, param)})`);
        o.registerMember(Temporal.PlainTime.prototype, "millisecond", (qb, exp, param) => `FLOOR(EXTRACT(MILLISECOND FROM ${qb.toString(exp.objectOperand, param)}))`);
        o.registerMember(Temporal.PlainTime.prototype, "microsecond", (qb, exp, param) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, param)}))`);
        o.registerMember(Temporal.PlainTime.prototype, "nanosecond", (qb, exp, param) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, param)})* 1000)`);

        o.registerMethod(Temporal.PlainTime.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'HH24:MI:SS.US')`);
        o.registerMethod(Temporal.PlainTime.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'HH24:MI:SS.US')`);
        o.registerMethod(Temporal.PlainTime.prototype, "add", (qb, exp, param) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, param));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, param)}) + make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainTime.prototype, "subtract", (qb, exp, param) => {
            const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
            const intervalParams = [] as string[];
            if (paramExp.object.years) {
                intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
            }
            if (paramExp.object.months) {
                intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
            }
            if (paramExp.object.weeks) {
                intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
            }
            if (paramExp.object.days) {
                intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
            }
            if (paramExp.object.hours) {
                intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
            }
            if (paramExp.object.minutes) {
                intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
            }
            let secondParts = [] as string[];
            if (paramExp.object.seconds) {
                secondParts.push(qb.toString(paramExp.object.seconds, param));
            }
            if (paramExp.object.milliseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
            }
            if (paramExp.object.nanoseconds) {
                secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
            }
            if (secondParts.length) {
                intervalParams.push(`secs => ${secondParts.join("+")}`);
            }
            return `${qb.toString(exp.objectOperand, param)}) - make_interval(${intervalParams.join(",")})`;
        });
        o.registerMethod(Temporal.PlainTime.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
        o.registerMethod(Temporal.PlainTime.prototype, "with", (qb, exp, param) => {
            if (exp.params.length !== 1) {
                throw Error("Temporal.PlainDate.with: only support info");
            }
            const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainTimeLike>;
            const objectQ = qb.toString(exp.objectOperand, param);
            let hourQ = `EXTRACT(HOUR FROM ${objectQ})`;
            if (paramInfoExp.object.hour) {
                hourQ = `COALESCE(${qb.toString(paramInfoExp.object.hour, param)}, ${hourQ})`;
            }
            let minuteQ = `EXTRACT(MINUTE FROM ${objectQ})`;
            if (paramInfoExp.object.minute) {
                minuteQ = `COALESCE(${qb.toString(paramInfoExp.object.minute, param)}, ${minuteQ})`;
            }
            let secondQ = `EXTRACT(SECOND FROM ${objectQ})`;
            const secondParts = [] as string[];
            if (paramInfoExp.object.second) {
                secondParts.push(qb.toString(paramInfoExp.object.second, param));
            }
            if (paramInfoExp.object.millisecond) {
                secondParts.push(`${qb.toString(paramInfoExp.object.second, param)}/1000.0`);
            }
            if (paramInfoExp.object.microsecond) {
                secondParts.push(`${qb.toString(paramInfoExp.object.second, param)}/1000000.0`);
            }
            if (paramInfoExp.object.nanosecond) {
                secondParts.push(`${qb.toString(paramInfoExp.object.second, param)}/1000000000.0`);
            }
            if (secondParts.length) {
                secondQ = `COALESCE(${secondParts.join("+")}, ${secondQ})`;
            }

            return `MAKE_TIME(CAST(${hourQ} as int), CAST(${minuteQ} as int), ${secondQ})`;
        });
        o.registerMethod(Temporal.PlainTime.prototype, "round", (qb, exp, param) => {
            let smallestUnitParam: IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>> = undefined;
            if (exp.params[0] instanceof ObjectValueExpression) {
                const paramExp = exp.params[0] as ObjectValueExpression<Exclude<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                if (paramExp.object.roundingMode) {
                    throw new Error(`Temporal.PlainTime.round: roundingMode not supported`);
                }
                if (paramExp.object.roundingIncrement) {
                    throw new Error(`Temporal.PlainTime.round: roundingIncrement not supported`);
                }
                if (paramExp.object.smallestUnit) {
                    smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
                }
            }
            else {
                smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
            return `DATE_TRUNC(${qb.toString(smallestUnitParam, param)}, ${qb.toString(exp.objectOperand, param)})`;
        });
        o.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, param) => {
            throw new Error(`Temporal.PlainDate.valueOf: not supported`);
        });


        /**
         * Temporal.Now
         * TODO: timeZoneId()
         */
        o.registerMethod(Temporal.Now, "instant", (qb, exp, param) => `CURRENT_TIMESTAMP`);
        o.registerMethod(Temporal.Now, "plainDateISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CURRENT_DATE`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as DATE)`;
        });
        o.registerMethod(Temporal.Now, "plainDateTimeISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CAST(CURRENT_TIMESTAMP as TIMESTAMP)`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as TIMESTAMP)`;
        });
        o.registerMethod(Temporal.Now, "plainTimeISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CURRENT_TIME`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as TIME)`;
        });
        o.registerMethod(Temporal.Now, "zonedDateTimeISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CURRENT_TIMESTAMP`;
            }

            return `CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)}`;
        });
    });
    registerTranslationFunction("sqlite", o => {
        o.registerValueType(Temporal.Instant, { columnType: { columnType: "text", group: "String" } });
        o.registerValueType(Temporal.PlainDate, { columnType: { columnType: "text", group: "String" } });
        o.registerValueType(Temporal.PlainTime, { columnType: { columnType: "text", group: "String" } });
    });
}
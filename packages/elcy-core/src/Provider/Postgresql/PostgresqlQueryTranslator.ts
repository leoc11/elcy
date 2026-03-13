import { Uuid } from "../../Data/Uuid";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";
import { ObjectValueExpression } from "src/ExpressionBuilder/Expression/ObjectValueExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";

export const postgresqlQueryTranslator = new QueryTranslator(Symbol("postgresql"));
postgresqlQueryTranslator.registerFallbacks(relationalQueryTranslator);

relationalQueryTranslator.registerFn(String, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS text)`);

postgresqlQueryTranslator.registerMethod(Uuid, "new", () => "uuid_generate_v4()");

postgresqlQueryTranslator.registerMember(Math, "LOG10E", () => "LOG(10, EXP(1))");
postgresqlQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(2, EXP(1))");

relationalQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `CHAR_LENGTH(${qb.toString(exp.objectOperand, param)})`);

(async () => {
    try {
        const Temporal = (await import('@js-temporal/polyfill')).Temporal;

        /**
         * Temporal.Instant
         * TODO: since, until
         */
        postgresqlQueryTranslator.registerMethod(Temporal.Instant, "from", (qb, exp, param) => `TIMESTAMPTZ ${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Temporal.Instant, "fromEpochMilliseconds", (qb, exp, param) => `to_timestamp(${qb.toString(exp.params[0], param)}/1000.0)`);
        postgresqlQueryTranslator.registerMethod(Temporal.Instant, "fromEpochNanoseconds", (qb, exp, param) => `to_timestamp(${qb.toString(exp.params[0], param)}/1000000000.0)`);

        postgresqlQueryTranslator.registerMember(Temporal.Instant.prototype, "epochMilliseconds", (qb, exp, param) => `EXTRACT(EPOCH FROM ${qb.toString(exp.objectOperand, param)}) * 1000`);
        postgresqlQueryTranslator.registerMember(Temporal.Instant.prototype, "epochNanoseconds", (qb, exp, param) => `EXTRACT(EPOCH FROM ${qb.toString(exp.objectOperand, param)}) * 1000000000`);

        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "toZonedDateTimeISO", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} AT TIME ZONE ${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "add", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "subtract", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "round", (qb, exp, param) => {
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
                    smallestUnitParam = paramExp.object.smallestUnit;
                }
            }
            else {
                smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
            return `DATE_TRUNC(${qb.toString(smallestUnitParam, param)}, ${qb.toString(exp.objectOperand, param)})`;
        });
        postgresqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "valueOf", (qb, exp, param) => {
            throw new Error(`Temporal.Instant.valueOf: not supported`);
        });


        /**
         * Temporal.PlainDate
         * TODO: since, until, calendarId, dayOfWeek, dayOfYear, daysInMonth, daysInWeek, daysInYear, era, eraYear, inleapYear
         * monthinyear, weekofyear, yearofweek, withCalendar()
         */
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate, "from", (qb, exp, param) => `DATE ${qb.toString(exp.params[0], param)}`);

        postgresqlQueryTranslator.registerMember(Temporal.PlainDate.prototype, "year", (qb, exp, param) => `EXTRACT(YEAR FROM ${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainDate.prototype, "month", (qb, exp, param) => `EXTRACT(MONTH FROM ${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainDate.prototype, "day", (qb, exp, param) => `EXTRACT(DAY FROM ${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainDate.prototype, "monthCode", (qb, exp, param) => `${qb.valueString("M")}`);

        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "add", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "subtract", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "with", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, param) => {
            throw new Error(`Temporal.PlainDate.valueOf: not supported`);
        });


        /**
         * Temporal.PlainTime
         * TODO: since, until
         */
        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime, "from", (qb, exp, param) => `TIME ${qb.toString(exp.params[0], param)}`);

        postgresqlQueryTranslator.registerMember(Temporal.PlainTime.prototype, "hour", (qb, exp, param) => `EXTRACT(HOUR FROM ${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainTime.prototype, "minute", (qb, exp, param) => `EXTRACT(MINUTE FROM ${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainTime.prototype, "second", (qb, exp, param) => `EXTRACT(SECOND FROM ${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainTime.prototype, "millisecond", (qb, exp, param) => `FLOOR(EXTRACT(MILLISECOND FROM ${qb.toString(exp.objectOperand, param)}))`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainTime.prototype, "microsecond", (qb, exp, param) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, param)}))`);
        postgresqlQueryTranslator.registerMember(Temporal.PlainTime.prototype, "nanosecond", (qb, exp, param) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, param)})* 1000)`);

        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'HH24:MI:SS.US')`);
        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'HH24:MI:SS.US')`);
        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "add", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "subtract", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "with", (qb, exp, param) => {
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
        postgresqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "round", (qb, exp, param) => {
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
                    smallestUnitParam = paramExp.object.smallestUnit;
                }
            }
            else {
                smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
            return `DATE_TRUNC(${qb.toString(smallestUnitParam, param)}, ${qb.toString(exp.objectOperand, param)})`;
        });
        postgresqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, param) => {
            throw new Error(`Temporal.PlainDate.valueOf: not supported`);
        });


        /**
         * Temporal.Now
         * TODO: timeZoneId()
         */
        postgresqlQueryTranslator.registerMethod(Temporal.Now, "instant", (qb, exp, param) => `CURRENT_TIMESTAMP`);
        postgresqlQueryTranslator.registerMethod(Temporal.Now, "plainDateISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CURRENT_DATE`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as DATE)`;
        });
        postgresqlQueryTranslator.registerMethod(Temporal.Now, "plainDateTimeISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CAST(CURRENT_TIMESTAMP as TIMESTAMP)`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as TIMESTAMP)`;
        });
        postgresqlQueryTranslator.registerMethod(Temporal.Now, "plainTimeISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CURRENT_TIME`;
            }

            return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as TIME)`;
        });
        postgresqlQueryTranslator.registerMethod(Temporal.Now, "zonedDateTimeISO", (qb, exp, param) => {
            if (!exp.params.length) {
                return `CURRENT_TIMESTAMP`;
            }

            return `CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)}`;
        });
    }
    catch {
        console.info('Temporal not found');
    }

    try {
        const Decimal = (await import('decimal.js')).default;

        /**
         * Decimal
         * TODO: toSD, toSignificantDigits, static methods
         */
        postgresqlQueryTranslator.registerType(Decimal, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} as NUMERIC)`, o => o.params.length === 1);
        postgresqlQueryTranslator.registerFn(Decimal, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} as NUMERIC)`, o => o.params.length === 1);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "plus", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}+${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "add", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}+${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "minus", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}-${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "sub", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}-${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "times", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}*${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "mul", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}*${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "div", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "dividedBy", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "pow", (qb, exp, param) => `POWER(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "toPower", (qb, exp, param) => `POWER(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "neg", (qb, exp, param) => `-${qb.toString(exp.objectOperand, param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "negated", (qb, exp, param) => `-${qb.toString(exp.objectOperand, param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "abs", (qb, exp, param) => `ABS(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "absoluteValue", (qb, exp, param) => `ABS(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "mod", (qb, exp, param) => `MOD(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "modulo", (qb, exp, param) => `MOD(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "sqrt", (qb, exp, param) => `SQRT(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "squareRoot", (qb, exp, param) => `SQRT(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "cbrt", (qb, exp, param) => `CBRT(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "cubeRoot", (qb, exp, param) => `CBRT(${qb.toString(exp.objectOperand, param)})`);

        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "eq", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "lt", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "lessThan", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "lte", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "lessThanOrEqualTo", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "gt", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "greaterThan", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "gte", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>=${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "greaterThanOrEqualTo", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>=${qb.toString(exp.params[0], param)}`);

        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "round", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "floor", (qb, exp, param) => `FLOOR(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "ceil", (qb, exp, param) => `CEILING(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "trunc", (qb, exp, param) => `TRUNC(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "truncated", (qb, exp, param) => `TRUNC(${qb.toString(exp.objectOperand, param)})`);

        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "sin", (qb, exp, param) => `SIN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "sine", (qb, exp, param) => `SIN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "cos", (qb, exp, param) => `COS(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "cosine", (qb, exp, param) => `COS(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "tan", (qb, exp, param) => `TAN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "tangent", (qb, exp, param) => `TAN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "asin", (qb, exp, param) => `ASIN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "inverseSine", (qb, exp, param) => `ASIN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "acos", (qb, exp, param) => `ACOS(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "inverseCosine", (qb, exp, param) => `ACOS(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "atan", (qb, exp, param) => `ATAN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "inverseTangent", (qb, exp, param) => `ATAN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "sinh", (qb, exp, param) => `SINH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicSine", (qb, exp, param) => `SINH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "cosh", (qb, exp, param) => `COSH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicCosine", (qb, exp, param) => `COSH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "tanh", (qb, exp, param) => `TANH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicTangent", (qb, exp, param) => `TANH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "asinh", (qb, exp, param) => `ASINH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicSine", (qb, exp, param) => `ASINH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "acosh", (qb, exp, param) => `ACOSH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicCosine", (qb, exp, param) => `ACOSH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "atanh", (qb, exp, param) => `ATANH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicTangent", (qb, exp, param) => `ATANH(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "exp", (qb, exp, param) => `EXP(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "naturalExponential", (qb, exp, param) => `EXP(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "ln", (qb, exp, param) => `LN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "naturalLogarithm", (qb, exp, param) => `LN(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "log", (qb, exp, param) => `LOG(${qb.toString(exp.objectOperand, param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "logarithm", (qb, exp, param) => `LOG(${qb.toString(exp.objectOperand, param)})`);

        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "clamp", (qb, exp, param) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)}), ${qb.toString(exp.params[1], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "clampedTo", (qb, exp, param) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)}), ${qb.toString(exp.params[1], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "divToInt", (qb, exp, param) => `FLOOR(${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "dividedToIntegerBy", (qb, exp, param) => `FLOOR(${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)})`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "toDP", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`, o => o.params.length === 1);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "toDecimalPlaces", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`, o => o.params.length === 1);

        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "toNumber", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} as DOUBLE PRECISION)`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "toNearest", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)})*${qb.toString(exp.params[0], param)}`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "toPrecision", (qb, exp, param) => {
            const ob = qb.toString(exp.objectOperand, param);
            const paramQ = exp.params.length ? qb.toString(exp.params[0], param) : "0";
            return `CASE WHEN ${ob}=0 THEN 0
ELSE ROUND(${ob}, ${paramQ} - FLOOR(LOG(10, ABS(${ob}))) - 1)
END`;
        });
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "cmp", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            const paramQ = qb.toString(exp.params[0], param);
            return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
        }, o => o.params.length === 1);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "comparedTo", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            const paramQ = qb.toString(exp.params[0], param);
            return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
        }, o => o.params.length === 1);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "decimalPlaces", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "dp", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isInt", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            return `${obQ}=TRUNC(${obQ})`;
        });
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isInteger", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            return `${obQ}=TRUNC(${obQ})`;
        });
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isNeg", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<0`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isNegative", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<0`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isPos", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>0`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isPositive", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>0`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isZero", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}=0`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isFinite", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} ~ '^-?[0-9]+(\.[0-9]+)?$'`);
        postgresqlQueryTranslator.registerMethod(Decimal.prototype, "isNaN", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} !~ '^-?[0-9]+(\.[0-9]+)?$'`);

        postgresqlQueryTranslator.registerMethod(Decimal, "random", (qb, exp, param) => {
            if (!exp.params.length) {
                return `RANDOM()`;
            }
            const paramQ = qb.toString(exp.params[0], param);
            return `FLOOR(RANDOM()* 10^${paramQ})/10^${paramQ}`;
        });

    }
    catch {
        console.info('Decimal.js not found');
    }
})();
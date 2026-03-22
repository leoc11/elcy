import { Uuid } from "../../Data/Uuid";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";
import { ObjectValueExpression } from "src/ExpressionBuilder/Expression/ObjectValueExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { Temporal } from "src/Data/Temporal";

export const postgresqlQueryTranslator = new QueryTranslator(Symbol("postgresql"));
postgresqlQueryTranslator.registerFallbacks(relationalQueryTranslator);

relationalQueryTranslator.registerFn(String, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS text)`);
relationalQueryTranslator.registerConstructor(Date, () => `NOW()`, exp => exp.params.length === 0);

postgresqlQueryTranslator.registerMethod(Uuid, "new", () => "uuid_generate_v4()");

postgresqlQueryTranslator.registerMember(Math, "LOG10E", () => "LOG(10, EXP(1))");
postgresqlQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(2, EXP(1))");

if (Temporal) {
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
                smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
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
                smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
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

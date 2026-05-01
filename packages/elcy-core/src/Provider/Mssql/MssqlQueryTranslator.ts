import { Decimal } from "src/Data/Decimal";
import { Uuid } from "../../Data/Uuid";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { DbFunction } from "../../Query/DbFunction";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { Version } from "src/Common/Version";
import { EqualExpression } from "src/ExpressionBuilder/Expression/EqualExpression";
import { IBinaryOperatorExpression } from "src/ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { NotEqualExpression } from "src/ExpressionBuilder/Expression/NotEqualExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "src/ExpressionBuilder/Expression/StrictNotEqualExpression";
import { IQueryBuilder } from "src/Query/IQueryBuilder";
import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";
import { isNonNullExp } from "src/Helper/Util";
import { Temporal } from "src/Data/Temporal";
import { ObjectValueExpression } from "src/ExpressionBuilder/Expression/ObjectValueExpression";

export const mssqlQueryTranslator = new QueryTranslator(Symbol("mssql"));
mssqlQueryTranslator.registerFallbacks(relationalQueryTranslator);

mssqlQueryTranslator.registerValueType(Boolean, { columnType: "bit", group: "Boolean" }, undefined, undefined, value => value ? "1" : "0");
mssqlQueryTranslator.registerValueType(Uuid, { columnType: "uniqueidentifier", group: "Identifier" });
mssqlQueryTranslator.registerValueType(Date, { columnType: "datetime2", group: "Identifier" });

mssqlQueryTranslator.registerMethod(Uuid, "new", () => "newid()", () => true);

mssqlQueryTranslator.registerMethod(Number.prototype, "toExponential", (qb, exp, param) => {
    let value = 12;
    if (exp.params.length) {
        value = qb.extractValue(exp.params[0] as IExpression<number>, param) ?? 12;
    }
    return `FORMAT(${qb.toString(exp.objectOperand, param)}, 'E${value}')`;
});

const equalTranslator = (qb: IQueryBuilder, exp: IBinaryOperatorExpression, context: IQueryBuilderContext) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, context);
    const rightExpString = qb.toOperandString(exp.rightOperand, context);
    if (rightExpString === "NULL") {
        return `${leftExpString} IS NULL`;
    }
    if (leftExpString === "NULL") {
        return `${rightExpString} IS NULL`;
    }
    if (isNonNullExp(exp.leftOperand) || isNonNullExp(exp.rightOperand)) {
        return `${leftExpString}=${rightExpString}`;
    }
    // SQL SERVER < 2022
    if (context?.option?.version && context?.option?.version < new Version(16)) {
        return `(${leftExpString}=${rightExpString} OR (${leftExpString} IS NULL AND ${rightExpString} IS NULL))`;
    }
    return `${leftExpString} IS NOT DISTINCT FROM ${rightExpString}`;
};
mssqlQueryTranslator.registerOperator(EqualExpression, equalTranslator);
mssqlQueryTranslator.registerOperator(StrictEqualExpression, equalTranslator);
const notEqualTranslator = (qb: IQueryBuilder, exp: NotEqualExpression | StrictNotEqualExpression, context: IQueryBuilderContext) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, context);
    const rightExpString = qb.toOperandString(exp.rightOperand, context);
    if (rightExpString === "NULL") {
        return `${leftExpString} IS NOT NULL`;
    }
    if (leftExpString === "NULL") {
        return `${rightExpString} IS NOT NULL`;
    }
    if (isNonNullExp(exp.leftOperand) || isNonNullExp(exp.rightOperand)) {
        return `${leftExpString}<>${rightExpString}`;
    }
    // SQL SERVER < 2022
    if (context?.option?.version && context?.option?.version < new Version(16)) {
        return `NOT(${leftExpString}=${rightExpString} OR (${leftExpString} IS NULL AND ${rightExpString} IS NULL))`;
    }
    return `${leftExpString} IS DISTINCT FROM ${rightExpString}`;
};
mssqlQueryTranslator.registerOperator(NotEqualExpression, notEqualTranslator);
mssqlQueryTranslator.registerOperator(StrictNotEqualExpression, notEqualTranslator);

/**
 * Math
 */
mssqlQueryTranslator.registerMember(Math, "LN10", () => "LOG(10)", () => true);
mssqlQueryTranslator.registerMember(Math, "LN2", () => "LOG(2)", () => true);
mssqlQueryTranslator.registerMember(Math, "LOG10E", () => "LOG10(EXP(1))", () => true);
mssqlQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(EXP(1), 2)", () => true);

mssqlQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `LEN(${qb.toString(exp.objectOperand, param)})`);

mssqlQueryTranslator.registerMethod(Math, "ceil", (qb, exp, param) => `CEILING(${qb.toString(exp.params[0], param)})`);

/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
mssqlQueryTranslator.registerMethod(String.prototype, "concat", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}+${exp.params.map((p) => qb.toString(p, param)).join("+")}`);
mssqlQueryTranslator.registerMethod(String.prototype, "endsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.valueString("%")}+${qb.toString(exp.params[0], param)})`);
mssqlQueryTranslator.registerMethod(String.prototype, "includes", (qb, exp, param) =>
    exp.params.length > 1
        ? `(${qb.toString(exp.params[0], param)} + RIGHT(${qb.toString(exp.objectOperand, param)}, (LEN(${qb.toString(exp.objectOperand, param)}) - ${qb.toString(exp.params[0], param)})))`
        : `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.valueString("%")}+${qb.toString(exp.params[0], param)}+${qb.valueString("%")})`);
mssqlQueryTranslator.registerMethod(String.prototype, "startsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.toString(exp.params[0], param)}+${qb.valueString("%")})`);
mssqlQueryTranslator.registerMethod(Date.prototype, "toDateString", (qb, exp, param) => `LEFT(DATENAME(WEEKDAY, ${qb.toString(exp.objectOperand, param)}), 3)+${qb.valueString(" ")}+LEFT(DATENAME(MONTH, ${qb.toString(exp.objectOperand, param)}), 3)+${qb.valueString(" ")}+RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2)+${qb.valueString(" ")}+RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2))`);

mssqlQueryTranslator.registerOperator(AdditionExpression, (qb, exp, param) => `${qb.toOperandString(exp.leftOperand, param)}+${qb.toOperandString(exp.rightOperand, param)}`);
mssqlQueryTranslator.registerMethod(DbFunction, "lastInsertedId", () => `scope_identity()`, () => true);
mssqlQueryTranslator.registerMethod(DbFunction, "dateAdd", (qb, exp, context) => {
    let dateExp = qb.toString(exp.params[0], context);
    const paramExp = exp.params[1] as ObjectValueExpression<Record<"years" | "months" | "days" | "hours" | "minutes" | "seconds" | "milliseconds", number>>;
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
    if (paramExp.object.months) {
        dateExp = `DATEADD(MONTH, ${qb.toString(paramExp.object.months, context)}, ${dateExp})`;
    }
    if (paramExp.object.years) {
        dateExp = `DATEADD(YYYY, ${qb.toString(paramExp.object.years, context)}, ${dateExp})`;
    }
    return dateExp;
});

mssqlQueryTranslator.registerMethod(Math, "max", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `(SELECT MAX(V) FROM (VALUES ${exp.params.map((o) => `(${qb.toString(o, param)})`).join(",")}) AS value(V))`;
});
mssqlQueryTranslator.registerMethod(Math, "min", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `(SELECT MIN(V) FROM (VALUES ${exp.params.map((o) => `(${qb.toString(o, param)})`).join(",")}) AS value(V))`;
});

mssqlQueryTranslator.registerMethod(Date.prototype, "getDate", (qb, exp, param) => `DAY(${qb.toString(exp.objectOperand, param)})`);


/**
 * DbFunction
 */
mssqlQueryTranslator.registerMethod(DbFunction, "timestamp", (qb, exp, param) => "getdate()", () => true);
mssqlQueryTranslator.registerMethod(DbFunction, "utcTimestamp", () => "getutcdate()", () => true);


if (Decimal) {
    mssqlQueryTranslator.registerMethod(Decimal.prototype, "decimalPlaces", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE LEN(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
    });
    mssqlQueryTranslator.registerMethod(Decimal.prototype, "dp", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE LEN(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
    });
}

if (Temporal) {
    mssqlQueryTranslator.registerValueType(Temporal.Instant, { columnType: "datetime2", group: "DateTime" });

    mssqlQueryTranslator.registerMethod(Temporal.Instant.prototype, "add", (qb, exp, context) => {
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

    mssqlQueryTranslator.registerMember(Temporal.PlainDate.prototype, "year", (qb, exp, param) => `YEAR(${qb.toString(exp.objectOperand, param)})`);
    mssqlQueryTranslator.registerMember(Temporal.PlainDate.prototype, "month", (qb, exp, param) => `MONTH(${qb.toString(exp.objectOperand, param)})`);
    mssqlQueryTranslator.registerMember(Temporal.PlainDate.prototype, "day", (qb, exp, param) => `DAY(${qb.toString(exp.objectOperand, param)})`);

    mssqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "with", (qb, exp, param) => {
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
    mssqlQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "add", (qb, exp, context) => {
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
    mssqlQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "add", (qb, exp, context) => {
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
}
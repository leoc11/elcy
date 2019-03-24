import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relation/RelationalQueryTranslator";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { DbFunction } from "../../Query/DbFunction";

export const sqliteQueryTranslator = new QueryTranslator(Symbol("sqlite"));
sqliteQueryTranslator.registerFallbacks(relationalQueryTranslator);

//#region Function

sqliteQueryTranslator.registerFn(isNaN, null);

//#endregion


//#region Member Access

/**
 * Math
 */
sqliteQueryTranslator.registerMember(Math, "E", null);
sqliteQueryTranslator.registerMember(Math, "LN10", null);
sqliteQueryTranslator.registerMember(Math, "LN2", null);
sqliteQueryTranslator.registerMember(Math, "SQRT1_2", null);
sqliteQueryTranslator.registerMember(Math, "SQRT2", null);

/**
 * String
 */
sqliteQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => "LENGTH(" + qb.toString(exp.objectOperand, param) + ")");

//#endregion


//#region Method Call

/**
 * DbFunction
 */
sqliteQueryTranslator.registerMethod(DbFunction, "lastInsertedId", () => `LAST_INSERT_ROWID()`, () => true);
sqliteQueryTranslator.registerMethod(DbFunction, "coalesce", (qb, exp, param) => `COALESCE(${exp.params.select(o => qb.toString(o, param)).toArray().join(", ")})`);


/**
 * Math
 * TODO: acosh,asinh,atanh,cbrt,clz32,fround,imul
 */
sqliteQueryTranslator.registerMethod(Math, "abs", (qb, exp, param) => `ABS(${qb.toString(exp.params[0], param)})`);
sqliteQueryTranslator.registerMethod(Math, "floor", (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS INT)`);
sqliteQueryTranslator.registerMethod(Math, "ceil", (qb, exp, param) => `CAST(ROUND(${qb.toString(exp.params[0], param)} + 0.5) AS INT)`);
sqliteQueryTranslator.registerMethod(Math, "random", () => "ABS(RANDOM()/9223372036854789000)");
sqliteQueryTranslator.registerMethod(Math, "round", (qb, exp, param) => `ROUND(${qb.toString(exp.params[0], param)}, 0)`);
sqliteQueryTranslator.registerMethod(Math, "max", (qb, exp, param) => `MAX(${exp.params.select(o => qb.toString(o, param)).toArray().join(",")})`);
sqliteQueryTranslator.registerMethod(Math, "min", (qb, exp, param) => `MIN(${exp.params.select(o => qb.toString(o, param)).toArray().join(",")})`);

sqliteQueryTranslator.registerMethod(Math, "acos", null);
sqliteQueryTranslator.registerMethod(Math, "asin", null);
sqliteQueryTranslator.registerMethod(Math, "atan", null);
sqliteQueryTranslator.registerMethod(Math, "cos", null);
sqliteQueryTranslator.registerMethod(Math, "exp", null);
sqliteQueryTranslator.registerMethod(Math, "sin", null);
sqliteQueryTranslator.registerMethod(Math, "sqrt", null);
sqliteQueryTranslator.registerMethod(Math, "tan", null);
sqliteQueryTranslator.registerMethod(Math, "log", null);
sqliteQueryTranslator.registerMethod(Math, "log10", null);
sqliteQueryTranslator.registerMethod(Math, "sign", null);
sqliteQueryTranslator.registerMethod(Math, "atan2", null);
sqliteQueryTranslator.registerMethod(Math, "pow", null);
sqliteQueryTranslator.registerMethod(Math, "expm1", null);
sqliteQueryTranslator.registerMethod(Math, "hypot", null);
sqliteQueryTranslator.registerMethod(Math, "log1p", null);
sqliteQueryTranslator.registerMethod(Math, "log2", null);
sqliteQueryTranslator.registerMethod(Math, "sinh", null);
sqliteQueryTranslator.registerMethod(Math, "cosh", null);
sqliteQueryTranslator.registerMethod(Math, "tanh", null);
sqliteQueryTranslator.registerMethod(Math, "trunc", null);

/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
sqliteQueryTranslator.registerMethod(String.prototype, "charAt", (qb, exp, param) => `SUBSTR(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)} + 1, 1)`);
sqliteQueryTranslator.registerMethod(String.prototype, "concat", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} || ${exp.params.select((p) => qb.toString(p, param)).toArray().join(" || ")}`);
sqliteQueryTranslator.registerMethod(String.prototype, "endsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE (${qb.valueString("%")} || ${qb.toString(exp.params[0], param)}))`);
sqliteQueryTranslator.registerMethod(String.prototype, "indexOf", (qb, exp, param) => {
    if (exp.params.length > 1) {
        `CASE WHEN INSTR(SUBSTR(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[1], param)} + 1),${qb.toString(exp.params[0], param)}) = 0 THEN ${qb.valueString(-1)} ELSE (INSTR(SUBSTR(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[1], param)} + 1),${qb.toString(exp.params[0], param)}) + ${qb.toString(exp.params[1], param)} - 1) END`;
    }
    return `(INSTR(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)}) - 1)`;
});
sqliteQueryTranslator.registerMethod(String.prototype, "like", (qb, exp, param) => {
    let escape = qb.valueString("\\");
    if (exp.params.length > 1)
        escape = qb.toString(exp.params[1], param);

    return `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.toString(exp.params[0], param)} ESCAPE ${escape})`;
});
sqliteQueryTranslator.registerMethod(String.prototype, "startsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE (${qb.toString(exp.params[0], param)} || ${qb.valueString("%")}))`);
sqliteQueryTranslator.registerMethod(String.prototype, "substr", (qb, exp, param) => `SUBSTR(${qb.toString(exp.objectOperand, param)}, (${qb.toString(exp.params[0], param)} + 1)${(exp.params.length > 1 ? `, ${qb.toString(exp.params[1], param)}` : "")})`);
sqliteQueryTranslator.registerMethod(String.prototype, "substring", (qb, exp, param) => `SUBSTR(${qb.toString(exp.objectOperand, param)}, (${qb.toString(exp.params[0], param)} + 1)${(exp.params.length > 1 ? `, (${qb.toString(exp.params[1], param)} - ${qb.toString(exp.params[0], param)})` : "")})`);
sqliteQueryTranslator.registerMethod(String.prototype, "toString", (qb, exp, param) => qb.toString(exp.objectOperand, param));
sqliteQueryTranslator.registerMethod(String.prototype, "valueOf", (qb, exp, param) => qb.toString(exp.objectOperand, param));
sqliteQueryTranslator.registerMethod(String.prototype, "trim", (qb, exp, param) => `TRIM(${qb.toString(exp.objectOperand, param)})`);
sqliteQueryTranslator.registerMethod(String.prototype, "includes", null);
sqliteQueryTranslator.registerMethod(String.prototype, "charCodeAt", null);
sqliteQueryTranslator.registerMethod(String.prototype, "lastIndexOf", null);
sqliteQueryTranslator.registerMethod(String.prototype, "repeat", null);
sqliteQueryTranslator.registerMethod(String.prototype, "split", null);

/**
 * Date
 * TODO: getTime,getTimezoneOffset,getUTCDate,getUTCDay,getUTCFullYear,getUTCHours,getUTCMilliseconds,getUTCMinutes,getUTCMonth,getUTCSeconds,getYear,setTime,setUTCDate,setUTCFullYear,setUTCHours,setUTCMilliseconds,setUTCMinutes,setUTCMonth,setUTCSeconds,toJSON,toISOString,toLocaleDateString,toLocaleTimeString,toLocaleString,toString,valueOf,toTimeString,toUTCString,toGMTString 
 */
sqliteQueryTranslator.registerMethod(Date, "timestamp", () => "STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW', 'LOCALTIME')");
sqliteQueryTranslator.registerMethod(Date, "utcTimestamp", () => "STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')");
sqliteQueryTranslator.registerMethod(Date.prototype, "getDate", (qb, exp, param) => `STRFTIME('%d', ${qb.toString(exp.objectOperand, param)})`);
sqliteQueryTranslator.registerMethod(Date.prototype, "getDay", (qb, exp, param) => `STRFTIME('%w', ${qb.toString(exp.objectOperand, param)})`);
sqliteQueryTranslator.registerMethod(Date.prototype, "getFullYear", (qb, exp, param) => `STRFTIME('%Y', ${qb.toString(exp.objectOperand, param)})`);
sqliteQueryTranslator.registerMethod(Date.prototype, "getHours", (qb, exp, param) => `STRFTIME('%H', ${qb.toString(exp.objectOperand, param)})`);
sqliteQueryTranslator.registerMethod(Date.prototype, "getMinutes", (qb, exp, param) => `STRFTIME('%M', ${qb.toString(exp.objectOperand, param)})`);
sqliteQueryTranslator.registerMethod(Date.prototype, "getMonth", (qb, exp, param) => `(STRFTIME('%m', ${qb.toString(exp.objectOperand, param)}) - 1)`);
sqliteQueryTranslator.registerMethod(Date.prototype, "getSeconds", (qb, exp, param) => `STRFTIME('%S', ${qb.toString(exp.objectOperand, param)})`);
sqliteQueryTranslator.registerMethod(Date.prototype, "getMilliseconds", (qb, exp, param) => `SUBSTR(STRFTIME('%f', ${qb.toString(exp.objectOperand, param)}), 4)`);
sqliteQueryTranslator.registerMethod(Date.prototype, "setDate", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '-' || STRFTIME('%d', ${qb.toString(exp.objectOperand, param)}) || ' DAYS', '+' || ${qb.toString(exp.params[0], param)} || ' DAYS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "setFullYear", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '-' || STRFTIME('%Y', ${qb.toString(exp.objectOperand, param)}) || ' YEARS', '+' || ${qb.toString(exp.params[0], param)} || ' YEARS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "setHours", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '-' || STRFTIME('%H', ${qb.toString(exp.objectOperand, param)}) || ' HOURS', '+' || ${qb.toString(exp.params[0], param)} || ' HOURS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "setMilliseconds", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '-0.' || SUBSTR(STRFTIME('%f', ${qb.toString(exp.objectOperand, param)}), 4) || ' SECONDS', '+' || (CAST(${qb.toString(exp.params[0], param)} AS FLOAT)/1000) || ' SECONDS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "setMinutes", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '-' || STRFTIME('%M', ${qb.toString(exp.objectOperand, param)}) || ' MINUTES', '+' || ${qb.toString(exp.params[0], param)} || ' MINUTES')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "setMonth", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '-' || STRFTIME('%m', ${qb.toString(exp.objectOperand, param)}) || ' MONTHS', '+' || (${qb.toString(exp.params[0], param)} + 1) || ' MONTHS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "setSeconds", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '-' || STRFTIME('%S', ${qb.toString(exp.objectOperand, param)}) || ' SECONDS', '+' || ${qb.toString(exp.params[0], param)} || ' SECONDS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "addDays", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '+' || ${qb.toString(exp.params[0], param)} || ' DAYS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "addMonths", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '+' || ${qb.toString(exp.params[0], param)} || ' MONTH')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "addYears", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '+' || ${qb.toString(exp.params[0], param)} || ' YEARS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "addHours", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '+' || ${qb.toString(exp.params[0], param)} || ' HOURS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "addMinutes", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '+' || ${qb.toString(exp.params[0], param)} || ' MINUTES')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "addSeconds", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '+' || ${qb.toString(exp.params[0], param)} || ' SECONDS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "addMilliseconds", (qb, exp, param) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.toString(exp.objectOperand, param)}, '+' || (CAST(${qb.toString(exp.params[0], param)} AS FLOAT)/1000) || ' SECONDS')`);
sqliteQueryTranslator.registerMethod(Date.prototype, "toDateString", null);

/**
 * RegExp
 * TODO: exec,toString
 */
sqliteQueryTranslator.registerMethod(RegExp.prototype, "test", null);

//#endregion


//#region Operator

sqliteQueryTranslator.registerOperator(AdditionExpression, (qb, exp, param) => `${qb.toOperandString(exp.leftOperand, param)} ${exp.type === String ? "||" : "+"} ${qb.toOperandString(exp.rightOperand, param)}`);

//#endregion

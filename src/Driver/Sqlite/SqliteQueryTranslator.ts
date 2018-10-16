import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { relationalQueryTranslator } from "../../QueryBuilder/QueryTranslator/RelationalQueryTranslator";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { QueryBuilderError, QueryBuilderErrorCode } from "../../Error/QueryBuilderError";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { DbFunction } from "../../QueryBuilder/DbFunction";

export const sqliteQueryTranslator = new QueryTranslator(Symbol("sqlite"));
sqliteQueryTranslator.registerFallbacks(relationalQueryTranslator);

const syntaxNotSupported = (name: string): any => {
    throw new QueryBuilderError(QueryBuilderErrorCode.NotSupported, `Sqlite did not support ${name}`);
};

//#region Function

sqliteQueryTranslator.register(isNaN, null);

//#endregion


//#region Member Access

/**
 * Math
 */
sqliteQueryTranslator.register(Math, "E", null);
sqliteQueryTranslator.register(Math, "LN10", null);
sqliteQueryTranslator.register(Math, "LN2", null);
sqliteQueryTranslator.register(Math, "LOG10E", null);
sqliteQueryTranslator.register(Math, "LOG2E", null);
sqliteQueryTranslator.register(Math, "PI", null);
sqliteQueryTranslator.register(Math, "SQRT1_2", null);
sqliteQueryTranslator.register(Math, "SQRT2", null);

/**
 * String
 */
sqliteQueryTranslator.register(String.prototype, "length", (exp: MemberAccessExpression<any, any>, qb: QueryBuilder) => "LENGTH(" + qb.getExpressionString(exp.objectOperand) + ")");

//#endregion


//#region Method Call

/**
 * Math
 * TODO: acosh,asinh,atanh,cbrt,clz32,fround,imul
 */
sqliteQueryTranslator.register(DbFunction, "lastInsertedId", () => `LAST_INSERT_ROWID()`);
sqliteQueryTranslator.register(DbFunction, "coalesce", (exp: MethodCallExpression, qb: QueryBuilder) => `COALESCE(${exp.params.select(o => qb.getExpressionString(o)).toArray().join(", ")})`);


/**
 * Math
 * TODO: acosh,asinh,atanh,cbrt,clz32,fround,imul
 */
sqliteQueryTranslator.register(Math, "abs", (exp: MethodCallExpression, qb: QueryBuilder) => `ABS(${qb.getExpressionString(exp.params[0])})`);
sqliteQueryTranslator.register(Math, "floor", (exp: MethodCallExpression, qb: QueryBuilder) => `CAST(${qb.getExpressionString(exp.params[0])} AS INT)`);
sqliteQueryTranslator.register(Math, "ceil", (exp: MethodCallExpression, qb: QueryBuilder) => `CAST(ROUND(${qb.getExpressionString(exp.params[0])} + 0.5) AS INT)`);
sqliteQueryTranslator.register(Math, "random", () => "ABS(RANDOM()/9223372036854789000)", false);
sqliteQueryTranslator.register(Math, "round", (exp: MethodCallExpression, qb: QueryBuilder) => `ROUND(${qb.getExpressionString(exp.params[0])}, 0)`);
sqliteQueryTranslator.register(Math, "max", (exp: MethodCallExpression, qb: QueryBuilder) => `MAX(${exp.params.select(o => qb.getExpressionString(o)).toArray().join(",")})`);
sqliteQueryTranslator.register(Math, "min", (exp: MethodCallExpression, qb: QueryBuilder) => `MIN(${exp.params.select(o => qb.getExpressionString(o)).toArray().join(",")})`);

sqliteQueryTranslator.register(Math, "acos", null);
sqliteQueryTranslator.register(Math, "asin", null);
sqliteQueryTranslator.register(Math, "atan", null);
sqliteQueryTranslator.register(Math, "cos", null);
sqliteQueryTranslator.register(Math, "exp", null);
sqliteQueryTranslator.register(Math, "sin", null);
sqliteQueryTranslator.register(Math, "sqrt", null);
sqliteQueryTranslator.register(Math, "tan", null);
sqliteQueryTranslator.register(Math, "log", null);
sqliteQueryTranslator.register(Math, "log10", null);
sqliteQueryTranslator.register(Math, "sign", null);
sqliteQueryTranslator.register(Math, "atan2", null);
sqliteQueryTranslator.register(Math, "pow", null);
sqliteQueryTranslator.register(Math, "expm1", null);
sqliteQueryTranslator.register(Math, "hypot", null);
sqliteQueryTranslator.register(Math, "log1p", null);
sqliteQueryTranslator.register(Math, "log2", null);
sqliteQueryTranslator.register(Math, "sinh", null);
sqliteQueryTranslator.register(Math, "cosh", null);
sqliteQueryTranslator.register(Math, "tanh", null);
sqliteQueryTranslator.register(Math, "trunc", null);

/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
sqliteQueryTranslator.register(String.prototype, "charAt", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SUBSTR(${qb.getExpressionString(exp.objectOperand)}, ${qb.getExpressionString(exp.params[0])} + 1, 1)`);
sqliteQueryTranslator.register(String.prototype, "concat", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `${qb.getExpressionString(exp.objectOperand)} || ${exp.params.select((p) => qb.getExpressionString(p)).toArray().join(" || ")}`);
sqliteQueryTranslator.register(String.prototype, "endsWith", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.objectOperand)} LIKE (${qb.getValueString("%")} || ${qb.getExpressionString(exp.params[0])}))`);
sqliteQueryTranslator.register(String.prototype, "indexOf", (exp: MethodCallExpression, qb: QueryBuilder) => {
    if (exp.params.length > 1) {
        syntaxNotSupported("'indexOf' with start_pos parameter");
    }
    return `(INSTR(${qb.getExpressionString(exp.objectOperand)},${qb.getExpressionString(exp.params[0])}) - 1)`;
});
sqliteQueryTranslator.register(String.prototype, "startsWith", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.objectOperand)} LIKE (${qb.getExpressionString(exp.params[0])} || ${qb.getValueString("%")}))`);
sqliteQueryTranslator.register(String.prototype, "substr", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SUBSTR(${qb.getExpressionString(exp.objectOperand)}, (${qb.getExpressionString(exp.params[0])} + 1)${(exp.params.length > 1 ? `, ${qb.getExpressionString(exp.params[1])}` : "")})`);
sqliteQueryTranslator.register(String.prototype, "substring", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SUBSTR(${qb.getExpressionString(exp.objectOperand)}, (${qb.getExpressionString(exp.params[0])} + 1)${(exp.params.length > 1 ? `, (${qb.getExpressionString(exp.params[1])} - ${qb.getExpressionString(exp.params[0])})` : "")})`);
const stringValueOf = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => qb.getExpressionString(exp.objectOperand);
sqliteQueryTranslator.register(String.prototype, "toString", stringValueOf);
sqliteQueryTranslator.register(String.prototype, "valueOf", stringValueOf);
sqliteQueryTranslator.register(String.prototype, "trim", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `TRIM(${qb.getExpressionString(exp.objectOperand)})`);
sqliteQueryTranslator.register(String.prototype, "includes", null);
sqliteQueryTranslator.register(String.prototype, "charCodeAt", null);
sqliteQueryTranslator.register(String.prototype, "lastIndexOf", null);
sqliteQueryTranslator.register(String.prototype, "repeat", null);
sqliteQueryTranslator.register(String.prototype, "split", null);

/**
 * Date
 * TODO: getTime,getTimezoneOffset,getUTCDate,getUTCDay,getUTCFullYear,getUTCHours,getUTCMilliseconds,getUTCMinutes,getUTCMonth,getUTCSeconds,getYear,setTime,setUTCDate,setUTCFullYear,setUTCHours,setUTCMilliseconds,setUTCMinutes,setUTCMonth,setUTCSeconds,toJSON,toISOString,toLocaleDateString,toLocaleTimeString,toLocaleString,toString,valueOf,toTimeString,toUTCString,toGMTString 
 */
sqliteQueryTranslator.register(Date, "currentTimestamp", () => "STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')", true);
sqliteQueryTranslator.register(Date.prototype, "getDate", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%d', ${qb.getExpressionString(exp.objectOperand)})`);
sqliteQueryTranslator.register(Date.prototype, "getDay", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%w', ${qb.getExpressionString(exp.objectOperand)})`);
sqliteQueryTranslator.register(Date.prototype, "getFullYear", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y', ${qb.getExpressionString(exp.objectOperand)})`);
sqliteQueryTranslator.register(Date.prototype, "getHours", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%H', ${qb.getExpressionString(exp.objectOperand)})`);
sqliteQueryTranslator.register(Date.prototype, "getMinutes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%M', ${qb.getExpressionString(exp.objectOperand)})`);
sqliteQueryTranslator.register(Date.prototype, "getMonth", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(STRFTIME('%m', ${qb.getExpressionString(exp.objectOperand)}) - 1)`);
sqliteQueryTranslator.register(Date.prototype, "getSeconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%S', ${qb.getExpressionString(exp.objectOperand)})`);
sqliteQueryTranslator.register(Date.prototype, "getMilliseconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SUBSTR(STRFTIME('%f', ${qb.getExpressionString(exp.objectOperand)}), 4)`);
sqliteQueryTranslator.register(Date.prototype, "setDate", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '-' || STRFTIME('%d', ${qb.getExpressionString(exp.objectOperand)}) || ' DAYS', '+' || ${qb.getExpressionString(exp.params[0])} || ' DAYS')`);
sqliteQueryTranslator.register(Date.prototype, "setFullYear", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '-' || STRFTIME('%Y', ${qb.getExpressionString(exp.objectOperand)}) || ' YEARS', '+' || ${qb.getExpressionString(exp.params[0])} || ' YEARS')`);
sqliteQueryTranslator.register(Date.prototype, "setHours", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '-' || STRFTIME('%H', ${qb.getExpressionString(exp.objectOperand)}) || ' HOURS', '+' || ${qb.getExpressionString(exp.params[0])} || ' HOURS')`);
sqliteQueryTranslator.register(Date.prototype, "setMilliseconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '-0.' || SUBSTR(STRFTIME('%f', ${qb.getExpressionString(exp.objectOperand)}), 4) || ' SECONDS', '+' || (CAST(${qb.getExpressionString(exp.params[0])} AS FLOAT)/1000) || ' SECONDS')`);
sqliteQueryTranslator.register(Date.prototype, "setMinutes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '-' || STRFTIME('%M', ${qb.getExpressionString(exp.objectOperand)}) || ' MINUTES', '+' || ${qb.getExpressionString(exp.params[0])} || ' MINUTES')`);
sqliteQueryTranslator.register(Date.prototype, "setMonth", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '-' || STRFTIME('%m', ${qb.getExpressionString(exp.objectOperand)}) || ' MONTHS', '+' || (${qb.getExpressionString(exp.params[0])} + 1) || ' MONTHS')`);
sqliteQueryTranslator.register(Date.prototype, "setSeconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '-' || STRFTIME('%S', ${qb.getExpressionString(exp.objectOperand)}) || ' SECONDS', '+' || ${qb.getExpressionString(exp.params[0])} || ' SECONDS')`);
sqliteQueryTranslator.register(Date.prototype, "addDays", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '+' || ${qb.getExpressionString(exp.params[0])} || ' DAYS')`);
sqliteQueryTranslator.register(Date.prototype, "addMonths", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '+' || ${qb.getExpressionString(exp.params[0])} || ' MONTH')`);
sqliteQueryTranslator.register(Date.prototype, "addYears", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '+' || ${qb.getExpressionString(exp.params[0])} || ' YEARS')`);
sqliteQueryTranslator.register(Date.prototype, "addHours", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '+' || ${qb.getExpressionString(exp.params[0])} || ' HOURS')`);
sqliteQueryTranslator.register(Date.prototype, "addMinutes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '+' || ${qb.getExpressionString(exp.params[0])} || ' MINUTES')`);
sqliteQueryTranslator.register(Date.prototype, "addSeconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '+' || ${qb.getExpressionString(exp.params[0])} || ' SECONDS')`);
sqliteQueryTranslator.register(Date.prototype, "addMilliseconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRFTIME('%Y-%m-%d %H:%M:%f', ${qb.getExpressionString(exp.objectOperand)}, '+' || (CAST(${qb.getExpressionString(exp.params[0])} AS FLOAT)/1000) || ' SECONDS')`);
sqliteQueryTranslator.register(Date.prototype, "toDateString", null);

/**
 * RegExp
 * TODO: exec,toString
 */
sqliteQueryTranslator.register(RegExp.prototype, "test", null);

//#endregion


//#region Operator

sqliteQueryTranslator.register(AdditionExpression, (exp: any, qb: QueryBuilder) => {
    if (exp.type as any === String)
        return `${qb.getOperandString(exp.leftOperand)} || ${qb.getOperandString(exp.rightOperand)}`;

    return `${qb.getOperandString(exp.leftOperand)} + ${qb.getOperandString(exp.rightOperand)}`;
});

//#endregion

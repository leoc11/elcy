import { Enumerable } from "../../Enumerable/Enumerable";
import { AdditionAssignmentExpression } from "../../ExpressionBuilder/Expression/AdditionAssignmentExpression";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { AssignmentExpression } from "../../ExpressionBuilder/Expression/AssignmentExpression";
import { BitwiseAndAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseAndAssignmentExpression";
import { BitwiseAndExpression } from "../../ExpressionBuilder/Expression/BitwiseAndExpression";
import { BitwiseNotExpression } from "../../ExpressionBuilder/Expression/BitwiseNotExpression";
import { BitwiseOrAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseOrAssignmentExpression";
import { BitwiseOrExpression } from "../../ExpressionBuilder/Expression/BitwiseOrExpression";
import { BitwiseSignedRightShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseSignedRightShiftAssignmentExpression";
import { BitwiseXorAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseXorAssignmentExpression";
import { BitwiseXorExpression } from "../../ExpressionBuilder/Expression/BitwiseXorExpression";
import { BitwiseZeroLeftShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseZeroLeftShiftAssignmentExpression";
import { BitwiseZeroRightShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseZeroRightShiftAssignmentExpression";
import { DivisionAssignmentExpression } from "../../ExpressionBuilder/Expression/DivisionAssignmentExpression";
import { DivisionExpression } from "../../ExpressionBuilder/Expression/DivisionExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { ExponentiationAssignmentExpression } from "../../ExpressionBuilder/Expression/ExponentiationAssignmentExpression";
import { GreaterEqualExpression } from "../../ExpressionBuilder/Expression/GreaterEqualExpression";
import { GreaterThanExpression } from "../../ExpressionBuilder/Expression/GreaterThanExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { LeftDecrementExpression } from "../../ExpressionBuilder/Expression/LeftDecrementExpression";
import { LeftIncrementExpression } from "../../ExpressionBuilder/Expression/LeftIncrementExpression";
import { LessEqualExpression } from "../../ExpressionBuilder/Expression/LessEqualExpression";
import { LessThanExpression } from "../../ExpressionBuilder/Expression/LessThanExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ModulusAssignmentExpression } from "../../ExpressionBuilder/Expression/ModulusAssignmentExpression";
import { ModulusExpression } from "../../ExpressionBuilder/Expression/ModulusExpression";
import { MultiplicationAssignmentExpression } from "../../ExpressionBuilder/Expression/MultiplicationAssignmentExpression";
import { MultiplicationExpression } from "../../ExpressionBuilder/Expression/MultiplicationExpression";
import { NotEqualExpression } from "../../ExpressionBuilder/Expression/NotEqualExpression";
import { NotExpression } from "../../ExpressionBuilder/Expression/NotExpression";
import { OrExpression } from "../../ExpressionBuilder/Expression/OrExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { RightDecrementExpression } from "../../ExpressionBuilder/Expression/RightDecrementExpression";
import { RightIncrementExpression } from "../../ExpressionBuilder/Expression/RightIncrementExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "../../ExpressionBuilder/Expression/StrictNotEqualExpression";
import { SubstractionAssignmentExpression } from "../../ExpressionBuilder/Expression/SubstractionAssignmentExpression";
import { SubstractionExpression } from "../../ExpressionBuilder/Expression/SubstractionExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";

export const relationalQueryTranslator = new QueryTranslator(Symbol("relational"));

//#region Function

relationalQueryTranslator.registerFn(parseInt, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS INT)`);
relationalQueryTranslator.registerFn(parseFloat, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS FLOAT)`);
relationalQueryTranslator.registerFn(isNaN, (qb, exp, param) => `ISNUMERIC(${qb.toString(exp.params[0], param)}) = 0`);

//#endregion

//#region Member Access

/**
 * Math
 * TODO: LOG10E, LOG2E
 */
relationalQueryTranslator.registerMember(Math, "E", () => "EXP(1)", () => true);
relationalQueryTranslator.registerMember(Math, "LN10", () => "LN(10)", () => true);
relationalQueryTranslator.registerMember(Math, "LN2", () => "LN(2)", () => true);
relationalQueryTranslator.registerMember(Math, "PI", () => "PI()", () => true);
relationalQueryTranslator.registerMember(Math, "SQRT1_2", () => "SQRT(0.5)", () => true);
relationalQueryTranslator.registerMember(Math, "SQRT2", () => "SQRT(2)", () => true);

/**
 * String
 * TODO length
 */
relationalQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `CHAR_LENGTH(${qb.toString(exp.objectOperand, param)})`);

/**
 * Array
 * TODO: isArray
 */

/**
 * Date
 * TODO: UTC,now,parse
 */

//#endregion

//#region Method Call

/**
 * TODO: CHANGE TO QUERYABLE/ENUMERABLE
 * SelectExpression
 */
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "all" as any, (qb, exp, param) => `NOT EXIST(${qb.newLine(1) + qb.toString(exp.objectOperand, param) + qb.newLine(-1)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "any" as any, (qb, exp, param) => `EXIST(${qb.newLine(1) + qb.toString(exp.objectOperand, param) + qb.newLine(-1)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "count" as any, (qb, exp, param) => `COUNT(${qb.toString(exp.params[0], param)})`);
const aggregateTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderParameter) => `${exp.methodName.toUpperCase()}(${qb.toString(exp.params[0], param)})`;
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "sum" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "min" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "max" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "avg" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "contains" as any, (qb, exp, param) => `${qb.toString(exp.params[0], param)} IN (${qb.newLine(1, true)}${qb.toString(exp.objectOperand, param)}${qb.newLine(-1, true)})`);

/**
 * Array
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.registerMethod(Array.prototype, "contains", (qb, exp, param) => `${qb.toString(exp.params[0], param)} IN ${qb.toString(exp.objectOperand, param)}`);

/**
 * Enumerable
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.registerMethod(Enumerable.prototype, "contains", (qb, exp, param) => `${qb.toString(exp.params[0], param)} IN (${qb.newLine(1, true)}${qb.toString(exp.objectOperand, param)}${qb.newLine(-1, true)})`);

/**
 * Math
 * TODO: max,min,acosh,asinh,atanh,cbrt,clz32,fround,imul
 */
const trigonoTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderParameter) => `${exp.methodName.toUpperCase()}(${qb.toString(exp.params[0], param)})`;
relationalQueryTranslator.registerMethod(Math, "abs", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "acos", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "asin", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "atan", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "cos", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "exp", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "sin", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "sqrt", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "tan", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "floor", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "log", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "log10", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "sign", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "ceil", (qb, exp, param) => `CEIL(${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(Math, "atan2", (qb, exp, param) => `ATN2(${qb.toString(exp.params[0], param)}, ${qb.toString(exp.params[1], param)})`);
relationalQueryTranslator.registerMethod(Math, "pow", (qb, exp, param) => `POWER(${qb.toString(exp.params[0], param)}, ${qb.toString(exp.params[1], param)})`);
relationalQueryTranslator.registerMethod(Math, "random", () => "RAND()", () => true);
relationalQueryTranslator.registerMethod(Math, "round", (qb, exp, param) => `ROUND(${qb.toString(exp.params[0], param)}, 0)`);
relationalQueryTranslator.registerMethod(Math, "expm1", (qb, exp, param) => `(EXP(${qb.toString(exp.params[0], param)}) - 1)`);
relationalQueryTranslator.registerMethod(Math, "hypot", (qb, exp, param) => `SQRT(${exp.params.select((p) => `POWER(${qb.toString(p, param)}, 2)`).toArray().join(" + ")})`);
relationalQueryTranslator.registerMethod(Math, "log1p", (qb, exp, param) => `LOG(1 + ${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(Math, "log2", (qb, exp, param) => `LOG(${qb.toString(exp.params[0], param)}, 2)`);
relationalQueryTranslator.registerMethod(Math, "sinh", (qb, exp, param) => `((EXP(${qb.toString(exp.params[0], param)}) - EXP(-${qb.toString(exp.params[0], param)})) / 2)`);
relationalQueryTranslator.registerMethod(Math, "cosh", (qb, exp, param) => `((EXP(${qb.toString(exp.params[0], param)}) + EXP(-${qb.toString(exp.params[0], param)})) / 2)`);
relationalQueryTranslator.registerMethod(Math, "tanh", (qb, exp, param) => `((EXP(2 * ${qb.toString(exp.params[0], param)}) - 1) / (EXP(2 * ${qb.toString(exp.params[0], param)}) + 1))`);
relationalQueryTranslator.registerMethod(Math, "trunc", (qb, exp, param) => `(${qb.toString(exp.params[0], param)} | 0)`);
relationalQueryTranslator.registerMethod(Math, "max", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `GREATEST(${exp.params.select((o) => qb.toString(o, param)).toArray().join(",")})`;
});
relationalQueryTranslator.registerMethod(Math, "min", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `LEAST(${exp.params.select((o) => qb.toString(o, param)).toArray().join(",")})`;
});
/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
relationalQueryTranslator.registerMethod(String.prototype, "charAt", (qb, exp, param) => `SUBSTRING(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)} + 1, 1)`);
relationalQueryTranslator.registerMethod(String.prototype, "charCodeAt", (qb, exp, param) => `UNICODE(SUBSTRING(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)} + 1, 1))`);
relationalQueryTranslator.registerMethod(String.prototype, "concat", (qb, exp, param) => `CONCAT(${qb.toString(exp.objectOperand, param)}, ${exp.params.select((p) => qb.toString(p, param)).toArray().join(", ")})`);
relationalQueryTranslator.registerMethod(String.prototype, "endsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE CONCAT(${qb.valueString("%")}, ${qb.toString(exp.params[0], param)}))`);
relationalQueryTranslator.registerMethod(String.prototype, "includes", (qb, exp, param) =>
    exp.params.length > 1
        ? `(${qb.toString(exp.params[0], param)} + RIGHT(${qb.toString(exp.objectOperand, param)}, (LEN(${qb.toString(exp.objectOperand, param)}) - ${qb.toString(exp.params[0], param)})))`
        : `(${qb.toString(exp.objectOperand, param)} LIKE CONCAT(${qb.valueString("%")}, ${qb.toString(exp.params[0], param)}, ${qb.valueString("%")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "indexOf", (qb, exp, param) => `(CHARINDEX(${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param) + (exp.params.length > 1 ? `, ${qb.toString(exp.params[1], param)}` : "")}) - 1)`);
relationalQueryTranslator.registerMethod(String.prototype, "lastIndexOf", (qb, exp, param) => `(LEN(${qb.toString(exp.objectOperand, param)}) - CHARINDEX(${qb.toString(exp.params[0], param)}, REVERSE(${qb.toString(exp.objectOperand, param)})${(exp.params.length > 1 ? `, ${qb.toString(exp.params[1], param)}` : "")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "like", (qb, exp, param) => {
    let escape = "";
    if (exp.params.length > 1) {
        escape = ` ESCAPE ${qb.toString(exp.params[1], param)}`;
    }

    return `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.toString(exp.params[0], param)}${escape})`;
});
relationalQueryTranslator.registerMethod(String.prototype, "repeat", (qb, exp, param) => `REPLICATE(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(String.prototype, "replace", (qb, exp, param) => `REPLACE(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.params[1], param)})`);
relationalQueryTranslator.registerMethod(String.prototype, "split", (qb, exp, param) => `STRING_SPLIT(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(String.prototype, "startsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE CONCAT(${qb.toString(exp.params[0], param)}, ${qb.valueString("%")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "substr", (qb, exp, param) => `SUBSTRING(${qb.toString(exp.objectOperand, param)}, (${qb.toString(exp.params[0], param)} + 1), ${(exp.params.length > 1 ? qb.toString(exp.params[1], param) : "8000")})`);
relationalQueryTranslator.registerMethod(String.prototype, "substring", (qb, exp, param) => `SUBSTRING(${qb.toString(exp.objectOperand, param)}, (${qb.toString(exp.params[0], param)} + 1), ${(exp.params.length > 1 ? `(${qb.toString(exp.params[1], param)} - ${qb.toString(exp.params[0], param)})` : "8000")})`);
const tolowerTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderParameter) => `LOWER(${qb.toString(exp.objectOperand, param)})`;
relationalQueryTranslator.registerMethod(String.prototype, "toLowerCase", tolowerTranslator);
relationalQueryTranslator.registerMethod(String.prototype, "toLocaleLowerCase", tolowerTranslator);
const toupperTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderParameter) => `UPPER(${qb.toString(exp.objectOperand, param)})`;
relationalQueryTranslator.registerMethod(String.prototype, "toUpperCase", toupperTranslator);
relationalQueryTranslator.registerMethod(String.prototype, "toLocaleUpperCase", toupperTranslator);
const stringValueOf = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderParameter) => qb.toString(exp.objectOperand, param);
relationalQueryTranslator.registerMethod(String.prototype, "toString", stringValueOf);
relationalQueryTranslator.registerMethod(String.prototype, "valueOf", stringValueOf);
relationalQueryTranslator.registerMethod(String.prototype, "trim", (qb, exp, param) => `RTRIM(LTRIM(${qb.toString(exp.objectOperand, param)}))`);

/**
 * Number
 * TODO: isFinite,isInteger,isNaN,isSafeInteger,toExponential,toFixed,toPrecision
 */
relationalQueryTranslator.registerMethod(Number.prototype, "toString", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} AS nvarchar(255))`);
relationalQueryTranslator.registerMethod(Number.prototype, "valueOf", (qb, exp, param) => qb.toString(exp.objectOperand, param));

/**
 * Symbol
 * TODO: toString
 */

/**
 * Boolean
 * TODO:
 */
relationalQueryTranslator.registerMethod(Boolean.prototype, "toString" as any, (qb, exp, param) => `(CASE WHEN (${qb.toString(exp.objectOperand, param)}) THEN ${qb.valueString("true")} ELSE ${qb.valueString("false")} END)`);

/**
 * Date
 * TODO: getTime,getTimezoneOffset,getUTCDate,getUTCDay,getUTCFullYear,getUTCHours,getUTCMilliseconds,getUTCMinutes,getUTCMonth,getUTCSeconds,getYear,setTime,setUTCDate,setUTCFullYear,setUTCHours,setUTCMilliseconds,setUTCMinutes,setUTCMonth,setUTCSeconds,toJSON,toISOString,toLocaleDateString,toLocaleTimeString,toLocaleString,toString,valueOf,toTimeString,toUTCString,toGMTString
 * TODO: fromUTCDate,toUTCDate
 */
relationalQueryTranslator.registerMethod(Date, "timestamp", () => "CURRENT_TIMESTAMP", () => true);
relationalQueryTranslator.registerMethod(Date, "utcTimestamp", () => "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'", () => true);
relationalQueryTranslator.registerMethod(Date.prototype, "getDate", (qb, exp, param) => `DAY(${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getDay", (qb, exp, param) => `(DATEPART(weekday, ${qb.toString(exp.objectOperand, param)}) - 1)`);
relationalQueryTranslator.registerMethod(Date.prototype, "getFullYear", (qb, exp, param) => `YEAR(${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getHours", (qb, exp, param) => `DATEPART(hour, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMinutes", (qb, exp, param) => `DATEPART(minute, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMonth", (qb, exp, param) => `(MONTH(${qb.toString(exp.objectOperand, param)}) - 1)`);
relationalQueryTranslator.registerMethod(Date.prototype, "getSeconds", (qb, exp, param) => `DATEPART(second, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMilliseconds", (qb, exp, param) => `DATEPART(millisecond, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setDate", (qb, exp, param) => `DATEADD(DAY, (${qb.toString(exp.params[0], param)} - DAY(${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setFullYear", (qb, exp, param) => `DATEADD(YYYY, (${qb.toString(exp.params[0], param)} - YEAR(${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setHours", (qb, exp, param) => `DATEADD(HH, (${qb.toString(exp.params[0], param)} - DATEPART(hour, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMilliseconds", (qb, exp, param) => `DATEADD(MS, (${qb.toString(exp.params[0], param)} - DATEPART(millisecond, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMinutes", (qb, exp, param) => `DATEADD(MI, (${qb.toString(exp.params[0], param)} - DATEPART(minute, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMonth", (qb, exp, param) => `DATEADD(MM, (${qb.toString(exp.params[0], param)} - (MONTH(${qb.toString(exp.objectOperand, param)}) - 1)), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setSeconds", (qb, exp, param) => `DATEADD(SS, (${qb.toString(exp.params[0], param)} - DATEPART(second, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "toDateString", (qb, exp, param) => `CONCAT(LEFT(DATENAME(WEEKDAY, ${qb.toString(exp.objectOperand, param)}), 3), ${qb.valueString(" ")}, LEFT(DATENAME(MONTH, ${qb.toString(exp.objectOperand, param)}), 3), ${qb.valueString(" ")}, RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2), ${qb.valueString(" ")}, RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2))`);
relationalQueryTranslator.registerMethod(Date.prototype, "addDays", (qb, exp, param) => `DATEADD(DAY, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addMonths", (qb, exp, param) => `DATEADD(MM, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addYears", (qb, exp, param) => `DATEADD(YYYY, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addHours", (qb, exp, param) => `DATEADD(HH, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addMinutes", (qb, exp, param) => `DATEADD(MI, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addSeconds", (qb, exp, param) => `DATEADD(SS, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addMilliseconds", (qb, exp, param) => `DATEADD(MS, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "toDate", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} AS DATE)`);
relationalQueryTranslator.registerMethod(Date.prototype, "toTime", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} AS TIME)`);

/**
 * RegExp
 * TODO: exec,toString
 */
relationalQueryTranslator.registerMethod(RegExp.prototype, "test", (qb, exp, param) => `${qb.toString(exp.params[0], param)} REGEXP ${qb.toString(exp.objectOperand, param)}`);

/**
 * Function
 * TODO: apply,bind,call,toSource,toString
 */

//#endregion

//#region Operator

// http://dataeducation.com/bitmask-handling-part-4-left-shift-and-right-shift/
// TypeofExpression,BitwiseSignedRightShiftExpression, BitwiseZeroRightShiftExpression
// BitwiseZeroLeftShiftExpression,InstanceofExpression
const aritAssignmentTranlator = <T>(qb: IQueryBuilder, exp: IBinaryOperatorExpression<T>, operator: string, param: IQueryBuilderParameter) => {
    if (!(exp.leftOperand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter for left operand`);
    }
    const varString = qb.toString(exp.leftOperand, param);
    return `${varString} = ${varString}${operator}${qb.toOperandString(exp.rightOperand, param)}`;
};
relationalQueryTranslator.registerOperator(AdditionAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "+", param));
relationalQueryTranslator.registerOperator(SubstractionAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "-", param));
relationalQueryTranslator.registerOperator(MultiplicationAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "*", param));
relationalQueryTranslator.registerOperator(DivisionAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "/", param));
relationalQueryTranslator.registerOperator(ExponentiationAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "**", param));
relationalQueryTranslator.registerOperator(ModulusAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "%", param));
relationalQueryTranslator.registerOperator(BitwiseAndAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "&", param));
relationalQueryTranslator.registerOperator(BitwiseOrAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "|", param));
relationalQueryTranslator.registerOperator(BitwiseXorAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "^", param));
relationalQueryTranslator.registerOperator(BitwiseZeroLeftShiftAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "<<", param));
relationalQueryTranslator.registerOperator(BitwiseZeroRightShiftAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, ">>", param));
relationalQueryTranslator.registerOperator(BitwiseSignedRightShiftAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, ">>>", param));

const incrementTranslator = (qb: IQueryBuilder, exp: IUnaryOperatorExpression, operator: string, param: IQueryBuilderParameter) => {
    if (!(exp.operand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter operand`);
    }
    const varString = qb.toString(exp.operand, param);
    return `${varString} = ${varString}${operator}${qb.valueString(1)}`;
};
relationalQueryTranslator.registerOperator(LeftIncrementExpression, (qb, exp, param) => incrementTranslator(qb, exp, "+", param));
relationalQueryTranslator.registerOperator(LeftDecrementExpression, (qb, exp, param) => incrementTranslator(qb, exp, "-", param));
relationalQueryTranslator.registerOperator(RightIncrementExpression, (qb, exp, param) => `(${incrementTranslator(qb, exp, "+", param)}) - 1`);
relationalQueryTranslator.registerOperator(RightDecrementExpression, (qb, exp, param) => `(${incrementTranslator(qb, exp, "-", param)}) + 1`);

const binaryTranslator = <T>(qb: IQueryBuilder, exp: IBinaryOperatorExpression<T>, operator: string, param: IQueryBuilderParameter) => `${qb.toOperandString(exp.leftOperand, param)}${operator}${qb.toOperandString(exp.rightOperand, param)}`;
relationalQueryTranslator.registerOperator(AssignmentExpression, (qb, exp, param) => binaryTranslator(qb, exp, "=", param));
relationalQueryTranslator.registerOperator(GreaterEqualExpression, (qb, exp, param) => binaryTranslator(qb, exp, ">=", param));
relationalQueryTranslator.registerOperator(GreaterThanExpression, (qb, exp, param) => binaryTranslator(qb, exp, ">", param));
relationalQueryTranslator.registerOperator(LessEqualExpression, (qb, exp, param) => binaryTranslator(qb, exp, "<=", param));
relationalQueryTranslator.registerOperator(LessThanExpression, (qb, exp, param) => binaryTranslator(qb, exp, "<", param));
relationalQueryTranslator.registerOperator(ModulusExpression, (qb, exp, param) => binaryTranslator(qb, exp, "%", param));
relationalQueryTranslator.registerOperator(SubstractionExpression, (qb, exp, param) => binaryTranslator(qb, exp, "-", param));
relationalQueryTranslator.registerOperator(MultiplicationExpression, (qb, exp, param) => binaryTranslator(qb, exp, "*", param));
relationalQueryTranslator.registerOperator(DivisionExpression, (qb, exp, param) => binaryTranslator(qb, exp, "/", param));
relationalQueryTranslator.registerOperator(AdditionExpression, (qb, exp, param) => {
    if (exp.type === String) {
        return `CONCAT(${qb.toOperandString(exp.leftOperand, param)}, ${qb.toOperandString(exp.rightOperand, param)})`;
    }

    return `${qb.toOperandString(exp.leftOperand, param)}+${qb.toOperandString(exp.rightOperand, param)}`;
});
relationalQueryTranslator.registerOperator(BitwiseAndExpression, (qb, exp, param) => binaryTranslator(qb, exp, "&", param));
relationalQueryTranslator.registerOperator(BitwiseOrExpression, (qb, exp, param) => binaryTranslator(qb, exp, "|", param));
relationalQueryTranslator.registerOperator(BitwiseXorExpression, (qb, exp, param) => binaryTranslator(qb, exp, "^", param));

const notEqualTranslator = (qb: IQueryBuilder, exp: NotEqualExpression | StrictNotEqualExpression, param: IQueryBuilderParameter) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, param);
    const rightExpString = qb.toOperandString(exp.rightOperand, param);
    if (leftExpString === "NULL") {
        return `${rightExpString} IS NOT NULL`;
    }
    else if (rightExpString === "NULL") {
        return `${leftExpString} IS NOT NULL`;
    }
    else if (exp.leftOperand instanceof ParameterExpression || exp.rightOperand instanceof ParameterExpression) {
        return `${leftExpString}<>${rightExpString} AND (${leftExpString} IS NOT NULL OR ${rightExpString} IS NOT NULL)`;
    }
    return `${leftExpString}<>${rightExpString}`;
};
relationalQueryTranslator.registerOperator(NotEqualExpression, notEqualTranslator);
relationalQueryTranslator.registerOperator(StrictNotEqualExpression, notEqualTranslator);

const equalTranslator = (qb: IQueryBuilder, exp: IBinaryOperatorExpression, param: IQueryBuilderParameter) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, param);
    const rightExpString = qb.toOperandString(exp.rightOperand, param);
    if (leftExpString === "NULL") {
        return `${rightExpString} IS NULL`;
    }
    else if (rightExpString === "NULL") {
        return `${leftExpString} IS NULL`;
    }
    else if (exp.leftOperand instanceof ParameterExpression || exp.rightOperand instanceof ParameterExpression) {
        return `${leftExpString}=${rightExpString} OR (${leftExpString} IS NULL AND ${rightExpString} IS NULL)`;
    }
    return `${leftExpString}=${rightExpString}`;
};
relationalQueryTranslator.registerOperator(EqualExpression, equalTranslator);
relationalQueryTranslator.registerOperator(StrictEqualExpression, equalTranslator);

relationalQueryTranslator.registerOperator(OrExpression, (qb, exp, param) => `${qb.toLogicalString(exp.leftOperand, param)} OR ${qb.toLogicalString(exp.rightOperand, param)}`);
relationalQueryTranslator.registerOperator(AndExpression, (qb, exp, param) => `${qb.toLogicalString(exp.leftOperand, param)} AND ${qb.toLogicalString(exp.rightOperand, param)}`);
relationalQueryTranslator.registerOperator(NotExpression, (qb, exp, param) => `NOT(${qb.newLine(1)}${qb.toLogicalString(exp.operand, param)}${qb.newLine(-1)})`);
relationalQueryTranslator.registerOperator(BitwiseNotExpression, (qb, exp, param) => `~(${qb.toOperandString(exp.operand, param)})`);
relationalQueryTranslator.registerOperator(TernaryExpression, (qb, exp, param) => `(${qb.newLine(1)}CASE WHEN (${qb.toString(exp.logicalOperand, param)}) ${qb.newLine()}THEN ${qb.toOperandString(exp.trueOperand, param)}${qb.newLine()}ELSE ${qb.toOperandString(exp.falseOperand, param)}${qb.newLine()}END${qb.newLine(-1)})`);

//#endregion

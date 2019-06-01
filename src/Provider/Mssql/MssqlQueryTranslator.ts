import { Uuid } from "../../Data/Uuid";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { DbFunction } from "../../Query/DbFunction";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";

export const mssqlQueryTranslator = new QueryTranslator(Symbol("mssql"));
mssqlQueryTranslator.registerFallbacks(relationalQueryTranslator);
mssqlQueryTranslator.registerMethod(Uuid, "new", () => "newid()", () => true);

mssqlQueryTranslator.registerType(Date, (qb, exp, param) => "getdate()", (exp: InstantiationExpression) => exp.params.length <= 0);
mssqlQueryTranslator.registerMethod(Date, "timestamp", (qb, exp, param) => "getdate()", () => true);
mssqlQueryTranslator.registerMethod(Date, "utcTimestamp", () => "getutcdate()", () => true);

/**
 * Math
 */
relationalQueryTranslator.registerMember(Math, "LN10", () => "LOG(10)", () => true);
relationalQueryTranslator.registerMember(Math, "LN2", () => "LOG(2)", () => true);
relationalQueryTranslator.registerMember(Math, "LOG10E", () => "LOG10(EXP(1))", () => true);
relationalQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(EXP(1), 2)", () => true);

relationalQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `LEN(${qb.toString(exp.objectOperand, param)})`);

relationalQueryTranslator.registerMethod(Math, "ceil", (qb, exp, param) => `CEILING(${qb.toString(exp.params[0], param)})`);

/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
mssqlQueryTranslator.registerMethod(String.prototype, "concat", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}+${exp.params.select((p) => qb.toString(p, param)).toArray().join("+")}`);
mssqlQueryTranslator.registerMethod(String.prototype, "endsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.valueString("%")}+${qb.toString(exp.params[0], param)})`);
mssqlQueryTranslator.registerMethod(String.prototype, "includes", (qb, exp, param) =>
    exp.params.length > 1
        ? `(${qb.toString(exp.params[0], param)} + RIGHT(${qb.toString(exp.objectOperand, param)}, (LEN(${qb.toString(exp.objectOperand, param)}) - ${qb.toString(exp.params[0], param)})))`
        : `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.valueString("%")}+${qb.toString(exp.params[0], param)}+${qb.valueString("%")})`);
mssqlQueryTranslator.registerMethod(String.prototype, "startsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE ${qb.toString(exp.params[0], param)}+${qb.valueString("%")})`);
mssqlQueryTranslator.registerMethod(Date.prototype, "toDateString", (qb, exp, param) => `LEFT(DATENAME(WEEKDAY, ${qb.toString(exp.objectOperand, param)}), 3)+${qb.valueString(" ")}+LEFT(DATENAME(MONTH, ${qb.toString(exp.objectOperand, param)}), 3)+${qb.valueString(" ")}+RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2)+${qb.valueString(" ")}+RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2))`);

mssqlQueryTranslator.registerOperator(AdditionExpression, (qb, exp, param) => `${qb.toOperandString(exp.leftOperand, param)}+${qb.toOperandString(exp.rightOperand, param)}`);
mssqlQueryTranslator.registerMethod(DbFunction, "lastInsertedId", () => `scope_identity()`, () => true);
mssqlQueryTranslator.registerMethod(DbFunction, "coalesce", (qb, exp, param) => `coalesce(${exp.params.select((o) => qb.toString(o, param)).toArray().join(", ")})`);
relationalQueryTranslator.registerMethod(Math, "max", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `(SELECT MAX(V) FROM (VALUES ${exp.params.select((o) => `(${qb.toString(o, param)})`).toArray().join(",")}) AS value(V))`;
});
relationalQueryTranslator.registerMethod(Math, "min", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `(SELECT MIN(V) FROM (VALUES ${exp.params.select((o) => `(${qb.toString(o, param)})`).toArray().join(",")}) AS value(V))`;
});

relationalQueryTranslator.registerMethod(Date.prototype, "getDate", (qb, exp, param) => `DAY(${qb.toString(exp.objectOperand, param)})`);

import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { relationalQueryTranslator } from "../../QueryBuilder/QueryTranslator/RelationalQueryTranslator";
import { UUID } from "../../Data/UUID";
import { DbFunction } from "../../QueryBuilder/DbFunction";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";

export const mssqlQueryTranslator = new QueryTranslator(Symbol("mssql"));
mssqlQueryTranslator.registerFallbacks(relationalQueryTranslator);
mssqlQueryTranslator.register(UUID, "new", (exp: IExpression) => "newid()");

mssqlQueryTranslator.register(Date, (exp: InstantiationExpression, qb: QueryBuilder) => {
    return "GETDATE()";
}, (exp: InstantiationExpression) => exp.params.length <= 0);
mssqlQueryTranslator.register(Date, "timestamp", (exp: MethodCallExpression) => {
    if (exp.params.length > 0 && exp.params[0].execute() === true) {
        return "getutcdate()";
    }
    return "getdate()";
}, (exp: MethodCallExpression) => {
    return exp.params.length <= 0 || exp.params[0] instanceof ValueExpression;
});


/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
mssqlQueryTranslator.register(String.prototype, "concat", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `${qb.getExpressionString(exp.objectOperand)}+${exp.params.select((p) => qb.getExpressionString(p)).toArray().join("+")}`);
mssqlQueryTranslator.register(String.prototype, "endsWith", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.objectOperand)} LIKE ${qb.valueString("%")}+${qb.getExpressionString(exp.params[0])})`);
mssqlQueryTranslator.register(String.prototype, "includes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) =>
    exp.params.length > 1
        ? `(${qb.getExpressionString(exp.params[0])} + RIGHT(${qb.getExpressionString(exp.objectOperand)}, (LEN(${qb.getExpressionString(exp.objectOperand)}) - ${qb.getExpressionString(exp.params[0])})))`
        : `(${qb.getExpressionString(exp.objectOperand)} LIKE ${qb.valueString("%")}+${qb.getExpressionString(exp.params[0])}+${qb.valueString("%")})`);
mssqlQueryTranslator.register(String.prototype, "startsWith", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.objectOperand)} LIKE ${qb.getExpressionString(exp.params[0])}+${qb.valueString("%")})`);
mssqlQueryTranslator.register(Date.prototype, "toDateString", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `LEFT(DATENAME(WEEKDAY, ${qb.getExpressionString(exp.objectOperand)}), 3)+${qb.valueString(" ")}+LEFT(DATENAME(MONTH, ${qb.getExpressionString(exp.objectOperand)}), 3)+${qb.valueString(" ")}+RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.getExpressionString(exp.objectOperand)}))), 2)+${qb.valueString(" ")}+RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.getExpressionString(exp.objectOperand)}))), 2))`);

mssqlQueryTranslator.register(AdditionExpression, (exp: any, qb: QueryBuilder) => {
    return `${qb.getOperandString(exp.leftOperand)}+${qb.getOperandString(exp.rightOperand)}`;
});
mssqlQueryTranslator.register(DbFunction, "lastInsertedId", () => `scope_identity()`);
mssqlQueryTranslator.register(DbFunction, "coalesce", (exp: MethodCallExpression, qb: QueryBuilder) => `coalesce(${exp.params.select(o => qb.getExpressionString(o)).toArray().join(", ")})`);

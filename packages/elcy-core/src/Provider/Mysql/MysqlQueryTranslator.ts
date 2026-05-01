import { EqualExpression } from "src/ExpressionBuilder/Expression/EqualExpression";
import { IBinaryOperatorExpression } from "src/ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { NotEqualExpression } from "src/ExpressionBuilder/Expression/NotEqualExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "src/ExpressionBuilder/Expression/StrictNotEqualExpression";
import { IQueryBuilder } from "src/Query/IQueryBuilder";
import { IQueryBuilderContext } from "src/Query/IQueryBuilderContext";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";
import { isNonNullExp } from "src/Helper/Util";
import { Uuid } from "src/Data/Uuid";
import { Null } from "src/Common/Constant";
import { DbFunction } from "src/Query/DbFunction";

export const mysqlQueryTranslator = new QueryTranslator(Symbol("mysql"));
mysqlQueryTranslator.registerFallbacks(relationalQueryTranslator);

mysqlQueryTranslator.registerValueType(Null, { columnType: "varchar", option: { length: 255 } });
mysqlQueryTranslator.registerValueType(String, { columnType: "varchar", option: { length: 255 } });
mysqlQueryTranslator.registerValueType(Uuid, { columnType: "binary", option: { size: 16 } });

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
    return `${leftExpString}<=>${rightExpString}`;
};
mysqlQueryTranslator.registerOperator(EqualExpression, equalTranslator);
mysqlQueryTranslator.registerOperator(StrictEqualExpression, equalTranslator);
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
    return `NOT(${leftExpString}<=>${rightExpString})`;
};
mysqlQueryTranslator.registerOperator(NotEqualExpression, notEqualTranslator);
mysqlQueryTranslator.registerOperator(StrictNotEqualExpression, notEqualTranslator);

/**
 * Math
 */
mysqlQueryTranslator.registerMember(Math, "LN10", () => "LOG(10)", () => true);
mysqlQueryTranslator.registerMember(Math, "LN2", () => "LOG(2)", () => true);
mysqlQueryTranslator.registerMember(Math, "LOG10E", () => "LOG10(EXP(1))", () => true);
mysqlQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(2, EXP(1))", () => true);
mysqlQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `CHAR_LENGTH(${qb.toString(exp.objectOperand, param)})`);
mysqlQueryTranslator.registerMethod(Math, "ceil", (qb, exp, param) => `CEILING(${qb.toString(exp.params[0], param)})`);


mysqlQueryTranslator.registerMethod(DbFunction, "utcTimestamp", () => "UTC_TIMESTAMP()", () => true);
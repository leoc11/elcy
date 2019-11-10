import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";

export const mysqlQueryTranslator = new QueryTranslator(Symbol("mysql"));
mysqlQueryTranslator.registerFallbacks(relationalQueryTranslator);

/**
 * Math
 */
mysqlQueryTranslator.registerMember(Math, "LN10", () => "LOG(10)", () => true);
mysqlQueryTranslator.registerMember(Math, "LN2", () => "LOG(2)", () => true);
mysqlQueryTranslator.registerMember(Math, "LOG10E", () => "LOG10(EXP(1))", () => true);
mysqlQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(2, EXP(1))", () => true);
mysqlQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `CHAR_LENGTH(${qb.toString(exp.objectOperand, param)})`);
mysqlQueryTranslator.registerMethod(Math, "ceil", (qb, exp, param) => `CEILING(${qb.toString(exp.params[0], param)})`);

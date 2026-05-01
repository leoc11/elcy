import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";

export const oracleQueryTranslator = new QueryTranslator(Symbol("oracle"));
oracleQueryTranslator.registerFallbacks(relationalQueryTranslator);

oracleQueryTranslator.registerMember(Math, "LOG10E", () => "LOG10(EXP(1))");
oracleQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(2, EXP(1))");

relationalQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `LENGTH(${qb.toString(exp.objectOperand, param)})`);

import { Uuid } from "../../Common/Uuid";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";

export const postgresqlQueryTranslator = new QueryTranslator(Symbol("postgresql"));
postgresqlQueryTranslator.registerFallbacks(relationalQueryTranslator);

postgresqlQueryTranslator.registerMethod(Uuid, "new", () => "uuid_generate_v4()");

postgresqlQueryTranslator.registerMember(Math, "LOG10E", () => "LOG(10, EXP(1))");
postgresqlQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(2, EXP(1))");

postgresqlQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `CHAR_LENGTH(${qb.toString(exp.objectOperand, param)})`);

import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { relationalQueryTranslator } from "../../QueryBuilder/QueryTranslator/RelationalQueryTranslator";
import { UUID } from "../../Data/UUID";
import { DbFunction } from "../../QueryBuilder/DbFunction";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";

export const mssqlQueryTranslator = new QueryTranslator(Symbol("mssql"));
mssqlQueryTranslator.registerFallbacks(relationalQueryTranslator);
mssqlQueryTranslator.register(UUID, "new", () => "NEWID()");
mssqlQueryTranslator.register(Date, (exp: InstantiationExpression, qb: QueryBuilder) => {
    return "GETDATE()";
}, (exp: InstantiationExpression) => exp.params.length <= 0);
mssqlQueryTranslator.register(DbFunction, "lastInsertedId", () => `SCOPE_IDENTITY()`);
mssqlQueryTranslator.register(DbFunction, "coalesce", (exp: MethodCallExpression, qb: QueryBuilder) => `COALESCE(${exp.params.select(o => qb.getExpressionString(o)).toArray().join(", ")})`);

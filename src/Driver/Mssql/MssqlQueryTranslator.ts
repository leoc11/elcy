import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { relationalQueryTranslator } from "../../QueryBuilder/QueryTranslator/RelationalQueryTranslator";
import { UUID } from "../../Data/UUID";
import { DbFunction } from "../../QueryBuilder/DbFunction";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

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

mssqlQueryTranslator.register(DbFunction, "lastInsertedId", () => `scope_identity()`);
mssqlQueryTranslator.register(DbFunction, "coalesce", (exp: MethodCallExpression, qb: QueryBuilder) => `coalesce(${exp.params.select(o => qb.getExpressionString(o)).toArray().join(", ")})`);

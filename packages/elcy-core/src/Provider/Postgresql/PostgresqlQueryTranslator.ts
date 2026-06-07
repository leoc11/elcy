import { Uuid } from "../../Data/Uuid";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { relationalQueryTranslator } from "../Relational/RelationalQueryTranslator";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { Null } from "src/Common/Constant";
import { BinaryColumnMetaData, DateTimeColumnMetaData, IdentifierColumnMetaData, RowVersionColumnMetaData, SerializeColumnMetaData, TimeColumnMetaData } from "src/MetaData";

export const postgresqlQueryTranslator = new QueryTranslator(Symbol("postgresql"));
postgresqlQueryTranslator.registerFallbacks(relationalQueryTranslator);

postgresqlQueryTranslator.registerValueType(Null, { columnType: { columnType: "text", group: "String" } });
postgresqlQueryTranslator.registerValueType(String, { columnType: { columnType: "text", group: "String" } });

postgresqlQueryTranslator.registerColumnType(BinaryColumnMetaData, { columnType: "bytea", group: "Binary" });
postgresqlQueryTranslator.registerColumnType(BinaryColumnMetaData, { columnType: "bytea", group: "Binary" });
postgresqlQueryTranslator.registerColumnType(DateTimeColumnMetaData, { columnType: "timestampz", group: "DateTime" });
postgresqlQueryTranslator.registerColumnType(IdentifierColumnMetaData, { columnType: "uuid", group: "Identifier" });
postgresqlQueryTranslator.registerColumnType(RowVersionColumnMetaData, { columnType: "xmin", group: "RowVersion" });
postgresqlQueryTranslator.registerColumnType(SerializeColumnMetaData, { columnType: "jsonb", group: "Serialize" });
postgresqlQueryTranslator.registerColumnType(TimeColumnMetaData, { columnType: "timetz", group: "Time" });

postgresqlQueryTranslator.registerFn(String, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS text)`);
postgresqlQueryTranslator.registerMethod(BigInt.prototype, "toString", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} AS text)`);

postgresqlQueryTranslator.registerMethod(Uuid, "new", () => "uuid_generate_v4()");

postgresqlQueryTranslator.registerMember(Math, "LOG10E", () => "LOG(10, EXP(1))");
postgresqlQueryTranslator.registerMember(Math, "LOG2E", () => "LOG(2, EXP(1))");

postgresqlQueryTranslator.registerMethod(Number.prototype, "toExponential", (qb, exp, param) => {
    let value = 12;
    if (exp.params.length) {
        value = qb.extractValue(exp.params[0] as IExpression<number>, param) ?? 12;
    }

    let decimalFormat = "9".repeat(value);
    if (decimalFormat) {
        decimalFormat = `.${decimalFormat}`;
    }
    return `to_char(${qb.toString(exp.objectOperand, param)}, '9${decimalFormat}EEEE')`;
});

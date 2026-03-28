import { Enumerable } from "@elcy/enumerable";
import { IQueryParameterMap } from "src/Query/IQueryParameter";
import { InsertExpression } from "src/Queryable/QueryExpression/InsertExpression";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MysqlColumnType } from "./MysqlColumnType";
import { TemporaryEntityExpression } from "src/Queryable/QueryExpression/TemporaryEntityExpression";

export class MysqlQueryBuilder extends RelationalQueryBuilder {
    //#region column type map
    public queryLimit: IQueryLimit = {
        maxParameters: 65535,
        maxQueryLength: 8388608
    };
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<MysqlColumnType>>([
        [Uuid, () => ({ columnType: "binary", option: { size: 16 } })],
        [BigInt, () => ({ columnType: "bigint" })],
        [TimeSpan, () => ({ columnType: "time" })],
        [Date, () => ({ columnType: "datetime" })],
        [String, (val: string) => ({ columnType: "varchar", option: { length: 255 + (Math.ceil(Math.max(val.length - 255, 0) / 50) * 50) } })],
        [Number, () => ({ columnType: "decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit" })]
    ]);

    //#endregion
    protected override createTableValueConstructorQuery<TE extends object>(entityExp: TemporaryEntityExpression<TE>, values: TE[], param?: IQueryBuilderParameter): string {
        const valueLiterals = values.map(o => {
            const valueQueries = entityExp.columns.map(p => {
                return `${this.valueString(o[p.propertyName] as ValueType)} AS ${this.enclose(p.columnName)}`;
            }).join(", ");
            return `SELECT ${valueQueries}`;
        }).join(`${this.newLine(1, false)}UNION ALL${this.newLine(1, false)}`)
        return `(${this.newLine(1)}${valueLiterals}${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}`;
    }
    protected override createTempTableQuery<TE extends object>(entityExp: TemporaryEntityExpression<TE>, values: TE[], param: IQueryBuilderParameter): IQuery[] {
        const result: IQuery[] = [];
        result.push({
            query: `DROP TEMPORARY TABLE IF EXISTS ${this.entityName(entityExp)}`,
            type: QueryType.DDL
        });
        const columnDefinition = entityExp.columns.map((c) => {
            const colTypeFactory = this.valueTypeMap.get(c.type);
            const maxValue = Enumerable.from(values).map((o) => (o[c.propertyName] as string)?.length).max();
            const colType = colTypeFactory(maxValue);
            return `${this.enclose(c.columnName)} ${this.columnTypeString(colType)}`;
        }).join("," + this.newLine(1, false));

        const query = `CREATE TEMPORARY TABLE ${this.entityName(entityExp)}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinition}` +
            `${this.newLine()})`;

        result.push({
            query,
            type: QueryType.DDL
        });

        const columns = entityExp.columns;
        const insertQuery = new InsertExpression(entityExp, [], columns);
        for (const item of values) {
            const itemExp: { [key: string]: IExpression } = {};
            for (const col of columns) {
                switch (col.propertyName) {
                    case "__value": {
                        itemExp[col.propertyName] = new ValueExpression(item);
                        break;
                    }
                    default: {
                        const propVal = item[col.propertyName];
                        itemExp[col.propertyName] = new ValueExpression(isNotNull(propVal) ? propVal : null);
                        break;
                    }
                }
            }
            insertQuery.values.push(itemExp as SetterObj<TE>);
        }

        result.push(...this.getInsertQuery(insertQuery, param.option, param.parameters));

        return result;
    }
}

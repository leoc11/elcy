import { Enumerable } from "@elcy/enumerable";
import { QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, ValueType } from "../../Common/Type";
import { Version } from "../../Common/Version";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { SqliteColumnType } from "./SqliteColumnType";
import { sqliteQueryTranslator } from "./SqliteQueryTranslator";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { TemporaryEntityExpression } from "src/Queryable/QueryExpression/TemporaryEntityExpression";
import { IEntityExpression } from "src/Queryable/QueryExpression/IEntityExpression";

export class SqliteQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxBatchQuery: 1,
        maxParameters: 999,
        maxQueryLength: 1000000
    };
    public override translator = sqliteQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<SqliteColumnType>>([
        [TimeSpan, () => ({ columnType: "text" })],
        [BigInt, () => ({ columnType: "integer", group: "BigInt" })],
        [Date, () => ({ columnType: "text" })],
        [String, () => ({ columnType: "text" })],
        [Number, () => ({ columnType: "numeric", group: "Real" })],
        [Boolean, () => ({ columnType: "integer" })],
        [Uuid, () => ({ columnType: "text" })]
    ]);
    public override getUpsertQuery(upsertExp: UpsertExpression, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: upsertExp
        };

        if (option && option.version && option.version < new Version(3, 24)) {
            return this.getUpsertQueryOlder(upsertExp, option, parameters);
        }

        const colString = Enumerable.from(upsertExp.insertColumns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const valueString = upsertExp.insertColumns.map((o) => {
            const valueExp = upsertExp.setter[o.propertyName];
            return valueExp ? this.toString(valueExp, param) : "DEFAULT";
        }).join(",");
        const primaryColString = upsertExp.entity.primaryColumns.map((o) => this.enclose(o.columnName)).join(",");
        const updateString = Enumerable.from(upsertExp.updateColumns).map((column) => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) {
                return null;
            }
            return `${this.enclose(column.columnName)} = EXCLUDED.${this.enclose(column.columnName)}`;
        }).filter((o) => !!o).toArray().join(`,${this.newLine(1)}`);

        const queryCommand: IQuery = {
            query: `INSERT INTO ${this.getEntityQueryString(upsertExp.entity, param)}(${colString})` + this.newLine()
                + `VALUES (${valueString}) ON CONFLICT(${primaryColString}) DO UPDATE SET ${updateString}`,
            parameters: this.getParameter(param),
            type: QueryType.DML
        };
        return [queryCommand];
    }
    protected getUpsertQueryOlder<T>(upsertExp: UpsertExpression<T>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: upsertExp
        };

        const colString = Enumerable.from(upsertExp.insertColumns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT OR IGNORE INTO ${this.getEntityQueryString(upsertExp.entity, param)}(${colString})` + this.newLine() +
            `VALUES (${upsertExp.insertColumns.map((o) => {
                const valueExp = upsertExp.setter[o.propertyName];
                return valueExp ? this.toString(valueExp, param) : "DEFAULT";
            }).join(",")})`;

        const queryCommand: IQuery = {
            query: insertQuery,
            parameters: this.getParameter(param),
            type: QueryType.DML
        };

        const result: IQuery[] = [queryCommand];

        const updateString = Enumerable.from(upsertExp.updateColumns).map((column) => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) {
                return null;
            }

            return `${this.enclose(column.columnName)} = ${this.toOperandString(valueExp, param)}`;
        }).filter((o) => !!o).toArray().join(`,${this.newLine(1)}`);

        const updateCommand: IQuery = {
            query: `UPDATE ${this.getEntityQueryString(upsertExp.entity, param)} SET ${updateString} WHERE ${this.toLogicalString(upsertExp.where, param)}`,
            parameters: queryCommand.parameters,
            type: QueryType.DML
        };
        result.push(updateCommand);
        return result;
    }
    protected override getPagingQueryString(select: SelectExpression, param?: IQueryBuilderParameter): string {
        let result = "";
        if (select.paging.take) {
            result += `${this.newLine()}LIMIT ${this.toString(select.paging.take, param)}`;
        }
        if (select.paging.skip) {
            result += `${this.newLine()}OFFSET ${this.toString(select.paging.skip, param)}`;
        }
        return result;
    }
    protected override entityName<T extends object>(entityExp: IEntityExpression<T>): string {
        if (entityExp instanceof TemporaryEntityExpression) {
            return `temp.${this.enclose(entityExp.name)}`;
        }

        return super.entityName(entityExp);
    }
    protected override createTableValueConstructorQuery<TE extends object>(entityExp: TemporaryEntityExpression<TE>, values: TE[], param?: IQueryBuilderParameter): string {
        const columns = entityExp.columns.map((o, i) => `column${i+1} AS ${this.enclose(o.columnName)}`).join(", ");
        let i = 0;
        const valueLiterals = values.map(o => {
            const valueQuery = entityExp.columns.map(p => {
                const value = p.propertyName === "__index" ? i++ : o[p.propertyName];
                return this.valueString(value as ValueType);
            }).join(", ");
            return `(${valueQuery})`;
        }).join(`,${this.newLine(2, false)}`)
        return `(${this.newLine(1)}SELECT${this.newLine(1)}${columns}${this.newLine(-1)}FROM (${this.newLine(1)}VALUES${this.newLine()}${valueLiterals}${this.newLine(-1)})${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}`;
    }
}

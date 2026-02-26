import { Enumerable } from "@elcy/enumerable";
import { QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType } from "../../Common/Type";
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

export class SqliteQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxBatchQuery: 1,
        maxParameters: 999,
        maxQueryLength: 1000000
    };
    public translator = sqliteQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<SqliteColumnType>>([
        [TimeSpan, () => ({ columnType: "text" })],
        [Date, () => ({ columnType: "text" })],
        [String, () => ({ columnType: "text" })],
        [Number, () => ({ columnType: "numeric" })],
        [Boolean, () => ({ columnType: "integer" })],
        [Uuid, () => ({ columnType: "text" })]
    ]);
    public getUpsertQuery(upsertExp: UpsertExpression, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: upsertExp
        };

        if (option && option.version && option.version < new Version(3, 24)) {
            return this.getUpsertQueryOlder(upsertExp, option, parameters);
        }

        const colString = upsertExp.insertColumns.map((o) => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
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

        const colString = upsertExp.insertColumns.map((o) => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
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
    protected override getPagingQueryString(select: SelectExpression): string {
        let result = "";
        if (select.paging.take) {
            result += `${this.newLine()}LIMIT ${this.toString(select.paging.take)}`;
        }
        if (select.paging.skip) {
            result += `${this.newLine()}OFFSET ${this.toString(select.paging.skip)}`;
        }
        return result;
    }
}

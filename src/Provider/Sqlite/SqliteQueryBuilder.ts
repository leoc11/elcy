import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, QueryType } from "../../Common/Type";
import { Version } from "../../Common/Version";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { RelationQueryBuilder } from "../Relation/RelationQueryBuilder";
import { SqliteColumnType } from "./SqliteColumnType";
import { sqliteQueryTranslator } from "./SqliteQueryTranslator";

export class SqliteQueryBuilder extends RelationQueryBuilder {
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

        const colString = upsertExp.insertColumns.select((o) => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const valueString = upsertExp.insertColumns.select((o) => {
            const valueExp = upsertExp.setter[o.propertyName];
            return valueExp ? this.toString(valueExp, param) : "DEFAULT";
        }).toArray().join(",");
        const primaryColString = upsertExp.entity.primaryColumns.select((o) => this.enclose(o.columnName)).toArray().join(",");
        const updateString = upsertExp.updateColumns.select((column) => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) {
                return undefined;
            }
            return `${this.enclose(column.columnName)} = EXCLUDED.${this.enclose(column.columnName)}`;
        }).where((o) => !!o).toArray().join(`,${this.newLine(1)}`);

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

        const colString = upsertExp.insertColumns.select((o) => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const insertQuery = `INSERT OR IGNORE INTO ${this.getEntityQueryString(upsertExp.entity, param)}(${colString})` + this.newLine() +
            `VALUES (${upsertExp.insertColumns.select((o) => {
                const valueExp = upsertExp.setter[o.propertyName];
                return valueExp ? this.toString(valueExp, param) : "DEFAULT";
            }).toArray().join(",")})`;

        const queryCommand: IQuery = {
            query: insertQuery,
            parameters: this.getParameter(param),
            type: QueryType.DML
        };

        const result: IQuery[] = [queryCommand];

        const updateString = upsertExp.updateColumns.select((column) => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) {
                return undefined;
            }

            return `${this.enclose(column.columnName)} = ${this.toOperandString(valueExp, param)}`;
        }).where((o) => !!o).toArray().join(`,${this.newLine(1)}`);

        const updateCommand: IQuery = {
            query: `UPDATE ${this.getEntityQueryString(upsertExp.entity, param)} SET ${updateString} WHERE ${this.toLogicalString(upsertExp.where, param)}`,
            parameters: queryCommand.parameters,
            type: QueryType.DML
        };
        result.push(updateCommand);
        return result;
    }
}

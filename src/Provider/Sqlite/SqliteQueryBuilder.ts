import { RelationQueryBuilder } from "../Relation/RelationQueryBuilder";
import { GenericType, QueryType } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { UUID } from "../../Data/UUID";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { IQuery } from "../../Query/IQuery";
import { sqliteQueryTranslator } from "./SqliteQueryTranslator";
import { Version } from "../../Common/Version";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameter } from "../../Query/IQueryParameter";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";

export class SqliteQueryBuilder extends RelationQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxBatchQuery: 1,
        maxParameters: 999,
        maxQueryLength: 1000000
    };
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType>([
        [TimeSpan, () => ({ columnType: "text" })],
        [Date, () => ({ columnType: "text" })],
        [String, () => ({ columnType: "text" })],
        [Number, () => ({ columnType: "numeric" })],
        [Boolean, () => ({ columnType: "numeric" })],
        [UUID, () => ({ columnType: "text" })]
    ]);
    public translator = sqliteQueryTranslator;
    public getUpsertQuery(upsertExp: UpsertExpression, option: IQueryOption, parameters: IQueryParameter[]): IQuery[] {
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: upsertExp
        };

        if (option && option.version && option.version < new Version(3, 24)) {
            return this.getUpsertQueryOlder(upsertExp, option, parameters);
        }

        const colString = upsertExp.columns.select(o => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const valueString = upsertExp.columns.select(o => {
            const valueExp = upsertExp.setter[o.propertyName];
            return valueExp ? this.toString(valueExp, param) : "DEFAULT";
        }).toArray().join(",");
        const primaryColString = upsertExp.entity.primaryColumns.select(o => this.enclose(o.columnName)).toArray().join(",");
        const updateString = upsertExp.updateColumns.select(column => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) return undefined;
            return `${this.enclose(column.columnName)} = EXCLUDED.${this.enclose(column.columnName)}`;
        }).where(o => !!o).toArray().join(`,${this.newLine(1)}`);

        let queryCommand: IQuery = {
            query: `INSERT INTO ${this.getEntityQueryString(upsertExp.entity, param)}(${colString})` + this.newLine()
                + `VALUES (${valueString}) ON CONFLICT(${primaryColString}) DO UPDATE SET ${updateString}`,
            parameters: this.getParameter(param),
            type: QueryType.DML
        };
        return [queryCommand];
    }
    protected getUpsertQueryOlder<T>(upsertExp: UpsertExpression<T>, option: IQueryOption, parameters: IQueryParameter[]): IQuery[] {
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: upsertExp
        };

        const colString = upsertExp.columns.select(o => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const insertQuery = `INSERT OR IGNORE INTO ${this.getEntityQueryString(upsertExp.entity, param)}(${colString})` + this.newLine() +
            `VALUES (${upsertExp.columns.select(o => {
                const valueExp = upsertExp.setter[o.propertyName];
                return valueExp ? this.toString(valueExp, param) : "DEFAULT";
            }).toArray().join(",")})`;

        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: this.getParameter(param),
            type: QueryType.DML
        };

        const result: IQuery[] = [queryCommand];

        const updateString = upsertExp.updateColumns.select(column => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) return undefined;

            return `${this.enclose(column.columnName)} = ${this.toOperandString(valueExp, param)}`;
        }).where(o => !!o).toArray().join(`,${this.newLine(1)}`);

        const updateCommand: IQuery = {
            query: `UPDATE ${this.getEntityQueryString(upsertExp.entity, param)} SET ${updateString} WHERE ${this.toLogicalString(upsertExp.where, param)}`,
            parameters: queryCommand.parameters,
            type: QueryType.DML
        };
        result.push(updateCommand);
        return result;
    }
}

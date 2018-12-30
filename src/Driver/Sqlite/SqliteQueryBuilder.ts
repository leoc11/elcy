import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType, QueryType } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { UUID } from "../../Data/UUID";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { sqliteQueryTranslator } from "./SqliteQueryTranslator";
import { Version } from "../../Common/Version";

export class SqliteQueryBuilder extends QueryBuilder {
    public version = new Version(3, 24);
    public queryLimit: IQueryLimit = {
        maxBatchQuery: 1,
        maxParameters: 999,
        maxQueryLength: 1000000
    };
    public supportedColumnTypes: Map<ColumnType, ColumnGroupType> = new Map<ColumnType, ColumnGroupType>([
        ["integer", "Integer"],
        ["numeric", "Decimal"],
        ["text", "String"],
        ["blob", "Binary"],
        ["real", "Real"],
    ]);
    public columnTypesWithOption: ColumnType[] = [];
    public columnTypeDefaults = new Map<ColumnType, IColumnTypeDefaults>();
    public columnTypeMap = new Map<ColumnTypeMapKey, ColumnType>([
        ["defaultBoolean", "numeric"],
        ["defaultBinary", "blob"],
        ["defaultDataSerialization", "text"],
        ["defaultDate", "text"],
        ["defaultDateTime", "text"],
        ["defaultTime", "text"],
        ["defaultDecimal", "numeric"],
        ["defaultEnum", "text"],
        ["defaultIdentifier", "text"],
        ["defaultInteger", "integer"],
        ["defaultReal", "real"],
        ["defaultString", "text"],
        ["defaultRowVersion", "blob"]
    ]);
    public valueTypeMap = new Map<GenericType, ColumnType>([
        [TimeSpan, "text"],
        [Date, "text"],
        [String, "text"],
        [Number, "numeric"],
        [Boolean, "numeric"],
        [UUID, "text"]
    ]);

    public translator = sqliteQueryTranslator;
    public entityName(entityMeta: IEntityMetaData<any>) {
        return `${this.enclose(entityMeta.name)}`;
    }

    protected getUpsertQueryOlder<T>(upsertExp: UpsertExpression<T>): IQuery[] {
        const colString = upsertExp.columns.select(o => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const insertQuery = `INSERT OR IGNORE INTO ${this.entityQuery(upsertExp.entity)}(${colString})` + this.newLine() +
            `VALUES (${upsertExp.columns.select(o => {
                const valueExp = upsertExp.setter[o.propertyName];
                return valueExp ? this.getExpressionString(valueExp) : "DEFAULT";
            }).toArray().join(",")})`;

        const param: { [key: string]: any } = {};
        for (const prop in upsertExp.setter) {
            const val = upsertExp.setter[prop];
            const paramExp = this.parameters.first(p => p.parameter === val);
            if (paramExp) {
                param[paramExp.name] = paramExp.value;
            }
        }
        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: param,
            type: QueryType.DML
        };

        const result: IQuery[] = [queryCommand];

        const updateString = upsertExp.updateColumns.select(column => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) return undefined;

            return `${this.enclose(column.columnName)} = ${this.getOperandString(valueExp)}`;
        }).where(o => !!o).toArray().join(`,${this.newLine(1)}`);

        const updateCommand: IQuery = {
            query: `UPDATE ${this.entityQuery(upsertExp.entity)} SET ${updateString} WHERE ${this.getLogicalOperandString(upsertExp.where)}`,
            parameters: queryCommand.parameters,
            type: QueryType.DML
        };
        result.push(updateCommand);
        return result;
    }
    public getUpsertQuery<T>(upsertExp: UpsertExpression<T>): IQuery[] {
        if (this.version < new Version(3, 24)) {
            return this.getUpsertQueryOlder(upsertExp);
        }

        const param: { [key: string]: any } = {};
        for (const prop in upsertExp.setter) {
            const val = upsertExp.setter[prop];
            const paramExp = this.parameters.first(p => p.parameter === val);
            if (paramExp) {
                param[paramExp.name] = paramExp.value;
            }
        }

        const colString = upsertExp.columns.select(o => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const valueString = upsertExp.columns.select(o => {
            const valueExp = upsertExp.setter[o.propertyName];
            return valueExp ? this.getExpressionString(valueExp) : "DEFAULT";
        }).toArray().join(",");
        const primaryColString = upsertExp.entity.primaryColumns.select(o => this.enclose(o.columnName)).toArray().join(",");
        const updateString = upsertExp.updateColumns.select(column => {
            const valueExp = upsertExp.setter[column.propertyName];
            if (!valueExp) return undefined;
            return `${this.enclose(column.columnName)} = EXCLUDED.${this.enclose(column.columnName)}`;
        }).where(o => !!o).toArray().join(`,${this.newLine(1)}`);

        let queryCommand: IQuery = {
            query: `INSERT INTO ${this.entityQuery(upsertExp.entity)}(${colString})` + this.newLine()
                + `VALUES (${valueString}) ON CONFLICT(${primaryColString}) DO UPDATE SET ${updateString}`,
            parameters: param,
            type: QueryType.DML
        };
        return [queryCommand];
    }
}

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

export class SqliteQueryBuilder extends QueryBuilder {
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
        ["defaultDataString", "text"],
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
    public getUpsertQuery(upsertExp: UpsertExpression): IQuery[] {
        const colString = upsertExp.columns.select(o => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const insertQuery = `INSERT OR IGNORE INTO ${this.getEntityQueryString(upsertExp.entity)}(${colString})` + this.newLine() +
            `VALUES (${upsertExp.values.select(o => o ? this.getExpressionString(o) : "DEFAULT").toArray().join(",")})`;

        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: upsertExp.values.select(o => this.parameters.first(p => p.parameter === o)).where(o => !!o).select(o => o.name).select(o => this.parameters.first(p => p.name === o)).reduce({} as { [key: string]: any }, (acc, item) => {
                acc[item.name] = item.value;
                return acc;
            }),
            type: QueryType.DML
        };

        const result: IQuery[] = [queryCommand];

        const updateString = upsertExp.updateColumns.select(o => {
            if (o.isPrimary)
                return undefined;
            const index = upsertExp.columns.indexOf(o);
            const value = upsertExp.values[index];
            if (!value) {
                return undefined;
            }
            return `${this.enclose(o.columnName)} = ${this.getOperandString(value)}`;
        }).where(o => !!o).toArray().join(`,${this.newLine(1)}`);

        const updateCommand: IQuery = {
            query: `UPDATE ${this.getEntityQueryString(upsertExp.entity)} SET ${updateString} WHERE ${this.getOperandString(upsertExp.where)}`,
            parameters: queryCommand.parameters,
            type: QueryType.DML
        };
        result.push(updateCommand);
        return result;
    }
}

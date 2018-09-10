import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../../Common/ColumnType";
import { IColumnTypeDefaults } from "../../Common/IColumnTypeDefaults";
import { GenericType } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { UUID } from "../../Data/UUID";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { relationalQueryTranslator } from "../../QueryBuilder/QueryTranslator/RelationalQueryTranslator";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";

export const sqliteQueryTranslator = new QueryTranslator(Symbol("sqlite"));
sqliteQueryTranslator.registerFallbacks(relationalQueryTranslator);
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
}

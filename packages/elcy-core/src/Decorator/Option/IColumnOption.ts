
import { CustomDataMapper } from "src/MetaData";
import { ColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import { GenericType, ValueType } from "../../Common/Type";
import { DbType } from "src/Common/StringType";

export interface IColumnOption<T = ValueType, TDb = DbType> {
    charset?: string;
    collation?: string;
    columnName?: string;
    columnType?: ColumnType;
    default?: () => T;
    description?: string;
    generation?: ColumnGeneration;
    indexed?: boolean;
    isProjected?: boolean;
    isReadOnly?: boolean;
    isSystemColumn?: boolean;
    nullable?: boolean;
    type?: GenericType<T>;
    customMapper?: CustomDataMapper<T, TDb>
}

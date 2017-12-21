
import { ColumnType } from "../../Driver/Types/ColumnType";
export interface IColumnMetaData<T> {
    name?: string;
    indexed?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: T;
    description?: string;
    columnType?: ColumnType;
    collation?: string;
    charset?: string;
}

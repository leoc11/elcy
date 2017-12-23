
import { ColumnType } from "../../Driver/Types/ColumnType";
import { genericType } from "../Types";
export interface IColumnMetaData<T> {
    name?: string;
    indexed?: boolean;
    nullable?: boolean;
    default?: T;
    type?: genericType<T>;
    description?: string;
    columnType?: ColumnType;
    collation?: string;
    charset?: string;
}

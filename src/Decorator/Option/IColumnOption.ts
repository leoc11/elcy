
import { ColumnType } from "../../Common/ColumnType";
import { GenericType, ColumnGeneration } from "../../Common/Type";
export interface IColumnOption<T = any> {
    columnName?: string;
    indexed?: boolean;
    nullable?: boolean;
    default?: () => T;
    type?: GenericType<T>;
    description?: string;
    columnType?: ColumnType;
    collation?: string;
    charset?: string;
    isReadOnly?: boolean;
    isProjected?: boolean;
    generation?: ColumnGeneration;
}

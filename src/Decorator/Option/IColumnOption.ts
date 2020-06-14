
import { ColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import { GenericType } from "../../Common/Type";

export interface IColumnFormatter<T, TD = any> {
    from: (source: T) => TD;
    to: (source: TD) => T;
}
export interface IColumnOption<T = any> {
    charset?: string;
    collation?: string;
    columnName?: string;
    columnType?: ColumnType;
    default?: () => T;
    description?: string;
    formatter?: IColumnFormatter<T>;
    generation?: ColumnGeneration;
    indexed?: boolean;
    isProjected?: boolean;
    isReadOnly?: boolean;
    nullable?: boolean;
    type?: GenericType<T>;
}

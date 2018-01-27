
import { ColumnType } from "../../Common/ColumnType";
import { GenericType } from "../../Common/Type";
export interface IColumnOption<T = any> {
    schema?: string;
    name?: string;
    indexed?: boolean;
    nullable?: boolean;
    default?: T;
    type?: GenericType<T>;
    description?: string;
    columnType?: ColumnType;
    collation?: string;
    charset?: string;
    isCreatedDate?: boolean;
    isModifiedDate?: boolean;
    isDeleteColumn?: boolean;
}

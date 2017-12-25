
import { ColumnType } from "../../Common/ColumnType";
import { genericType } from "../../Common/Type";
export interface IColumnOption<T = any> {
    schema?: string;
    name?: string;
    indexed?: boolean;
    nullable?: boolean;
    default?: T;
    type?: genericType<T>;
    description?: string;
    columnType?: ColumnType;
    collation?: string;
    charset?: string;
    isCreatedDate?: boolean;
    isModifiedDate?: boolean;
    isDeleteColumn?: boolean;
}

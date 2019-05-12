import { ColumnTypeGroup } from "./ColumnType";
import { IColumnTypeDefaults } from "./IColumnTypeDefaults";

export interface ICompleteColumnType<T = string> {
    columnType: T;
    group?: ColumnTypeGroup;
    option?: IColumnTypeDefaults;
}
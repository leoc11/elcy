import { ColumnType, ColumnTypeGroup } from "./ColumnType";
import { IColumnTypeDefaults } from "./IColumnTypeDefaults";

export interface ICompleteColumnType {
    columnType: ColumnType;
    group?: ColumnTypeGroup;
    option?: IColumnTypeDefaults;
}
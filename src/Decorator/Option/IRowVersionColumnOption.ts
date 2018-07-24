import { RowVersionColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";

export interface IRowVersionColumnOption extends IColumnOption<string> {
    columnType?: RowVersionColumnType;
}

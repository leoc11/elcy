import { RowVersionColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";

export interface IRowVersionColumnOption<T extends bigint | Uint8Array> extends IColumnOption<T> {
    columnType?: RowVersionColumnType;
}

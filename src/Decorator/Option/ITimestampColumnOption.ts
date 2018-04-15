import { TimestampColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";

export interface ITimestampColumnOption extends IColumnOption<string> {
    columnType?: TimestampColumnType;
}

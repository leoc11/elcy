import { StringColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IStringColumnOption extends IColumnOption<string> {
    maxLength?: number;
    columnType?: StringColumnType;
}

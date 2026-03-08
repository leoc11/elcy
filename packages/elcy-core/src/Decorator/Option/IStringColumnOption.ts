import { StringColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IStringColumnOption extends IColumnOption<string> {
    columnType?: StringColumnType;
    length?: number;
}

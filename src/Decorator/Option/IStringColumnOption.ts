import { StringColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IStringColumnOption extends IColumnOption<string> {
    maxLength?: number;
    columnType?: StringColumnType;
}

import { DateColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IDateColumnOption extends IColumnOption<Date> {
    columnType?: DateColumnType;
    precision?: number;
}

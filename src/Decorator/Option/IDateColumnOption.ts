import { DateColumnType } from "../../Common/ColumnType";
import { DateTimeKind } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IDateColumnOption extends IColumnOption<Date> {
    columnType?: DateColumnType;
    precision?: number;
    dateTimeKind?: DateTimeKind;
    /*
    * UTC TimeZone offset in minute.
    */
    timezoneOffset?: number;
}

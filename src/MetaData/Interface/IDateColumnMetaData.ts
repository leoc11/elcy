import { DateTimeKind } from "../Types";
import { IColumnMetaData } from "./IColumnMetaData";
// tslint:disable-next-line:ban-types
export interface IDateColumnMetaData extends IColumnMetaData<Date> {
    columnType?: "date" | "datetime";
    precision?: number;
    dateTimeKind?: DateTimeKind;
    /*
    * UTC TimeZone offset in minute.
    */
    timezoneOffset?: number;
}

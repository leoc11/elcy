import { dateTimeKind } from "../../Driver/Types/TypeValues";
import { IColumnMetaData } from "./IColumnMetaData";
// tslint:disable-next-line:ban-types
export interface IDateColumnMetaData extends IColumnMetaData<Date> {
    columnType?: "date" | "datetime";
    precision?: number;
    dateTimeKind?: dateTimeKind;
    /*
    * UTC TimeZone offset in minute.
    */
    timezoneOffset?: number;
}

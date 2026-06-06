import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { IColumnOption } from "./IColumnOption";
import { DateTimeValueType } from "src/Common/Type";

export interface IDateTimeColumnOption<T extends DateTimeValueType> extends IColumnOption<T> {
    columnType?: DateTimeColumnType;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
}

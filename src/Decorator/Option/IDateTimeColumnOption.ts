import { TimeZoneHandling } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";
import { DateTimeColumnType } from "../../Common/ColumnType";
export interface IDateTimeColumnOption extends IColumnOption<Date> {
    columnType?: DateTimeColumnType;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
    isCreatedDate?: boolean;
    isModifiedDate?: boolean;
}

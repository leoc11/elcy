import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";
export interface IDateTimeColumnOption extends IColumnOption<Date> {
    columnType?: DateTimeColumnType;
    isCreatedDate?: boolean;
    isModifiedDate?: boolean;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
}

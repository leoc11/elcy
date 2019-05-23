import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";
export interface IDateTimeColumnOption extends IColumnOption<Date> {
    columnType?: DateTimeColumnType;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
    isCreatedDate?: boolean;
    isModifiedDate?: boolean;
}

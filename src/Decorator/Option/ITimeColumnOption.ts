import { TimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { TimeSpan } from "../../Common/TimeSpan";
import { IColumnOption } from "./IColumnOption";

export interface ITimeColumnOption extends IColumnOption<TimeSpan> {
    columnType?: TimeColumnType;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
}

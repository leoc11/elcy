import { TimeZoneHandling } from "../../Common/Type";
import { TimeSpan } from "../../Data/TimeSpan";
import { IColumnOption } from "./IColumnOption";
import { TimeColumnType } from "../../Common/ColumnType";
// tslint:disable-next-line:ban-types
export interface ITimeColumnOption extends IColumnOption<TimeSpan> {
    columnType?: TimeColumnType;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
}

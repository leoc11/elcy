import type { Temporal } from "@js-temporal/polyfill";
import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { IColumnOption } from "./IColumnOption";

export interface IDateTimeColumnOption extends IColumnOption<Date | Temporal.Instant> {
    columnType?: DateTimeColumnType;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
}

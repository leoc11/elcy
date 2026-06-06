import { TimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { IColumnOption } from "./IColumnOption";
import { TimeValueType } from "src/Common/Type";

export interface ITimeColumnOption<T extends TimeValueType> extends IColumnOption<T> {
    columnType?: TimeColumnType;
    precision?: number;
    timeZoneHandling?: TimeZoneHandling;
}

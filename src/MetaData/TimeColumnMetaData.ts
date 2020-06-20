import { TimeColumnType } from "../Common/ColumnType";
import { TimeZoneHandling } from "../Common/StringType";
import { TimeSpan } from "../Common/TimeSpan";
import { ColumnMetaData } from "./ColumnMetaData";

export class TimeColumnMetaData extends ColumnMetaData<TimeSpan> {
    constructor() {
        super(TimeSpan);
    }
    public columnType: TimeColumnType = "time";
    public precision?: number;
    public timeZoneHandling: TimeZoneHandling = "utc";
    public applyOption(columnMeta: TimeColumnMetaData) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.timeZoneHandling !== "undefined") {
            this.timeZoneHandling = columnMeta.timeZoneHandling;
        }
        if (typeof columnMeta.precision !== "undefined") {
            this.precision = columnMeta.precision;
        }
    }
}

import { TimeColumnType } from "../Common/ColumnType";
import { TimeZoneHandling } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { TimeSpan } from "../Data/TimeSpan";
export class TimeColumnMetaData extends ColumnMetaData<TimeSpan> {
    public columnType: TimeColumnType = "time";
    public precision?: number;
    public timeZoneHandling: TimeZoneHandling = "utc";
    constructor() {
        super(TimeSpan);
    }
    public applyOption(columnMeta: TimeColumnMetaData) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.timeZoneHandling !== "undefined")
            this.timeZoneHandling = columnMeta.timeZoneHandling;
        if (typeof columnMeta.precision !== "undefined")
            this.precision = columnMeta.precision;
    }
}

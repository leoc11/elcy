import type { Temporal } from "@js-temporal/polyfill";
import { TimeColumnType } from "../Common/ColumnType";
import { TimeZoneHandling } from "../Common/StringType";
import { TimeSpan } from "../Data/TimeSpan";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { GenericType } from "src/Common/Type";

export class TimeColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, TimeSpan | Temporal.PlainTime> {
    constructor(entity?: IEntityMetaData<TE>, type?: GenericType<TimeSpan | Temporal.PlainTime>) {
        super(entity, type ?? TimeSpan);
    }
    public override columnType: TimeColumnType = "time";
    public precision?: number;
    public timeZoneHandling: TimeZoneHandling = "utc";
    public override applyOption(columnMeta: TimeColumnMetaData<TE>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.timeZoneHandling !== "undefined") {
            this.timeZoneHandling = columnMeta.timeZoneHandling;
        }
        if (typeof columnMeta.precision !== "undefined") {
            this.precision = columnMeta.precision;
        }
    }
}

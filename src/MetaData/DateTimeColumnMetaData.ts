import type { Temporal } from "@js-temporal/polyfill";
import { DateTimeColumnType } from "../Common/ColumnType";
import { TimeZoneHandling } from "../Common/StringType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { GenericType } from "src/Common/Type";

export class DateTimeColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, Date | Temporal.Instant> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<Date | Temporal.Instant>) {
        super(entityMeta, type ?? Date);
    }
    public columnType: DateTimeColumnType = "datetime";
    public isCreatedDate?: boolean;
    public isModifiedDate?: boolean;
    public precision?: number;
    public timeZoneHandling: TimeZoneHandling = "utc";
    public override applyOption(columnMeta: DateTimeColumnMetaData<TE>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.timeZoneHandling !== "undefined") {
            this.timeZoneHandling = columnMeta.timeZoneHandling;
        }
        if (typeof columnMeta.precision !== "undefined") {
            this.precision = columnMeta.precision;
        }
    }
}

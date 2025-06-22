import { DateTimeColumnType } from "../Common/ColumnType";
import { TimeZoneHandling } from "../Common/StringType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class DateTimeColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, Date> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Date, entityMeta);
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

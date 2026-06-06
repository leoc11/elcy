import { DateTimeColumnType } from "../Common/ColumnType";
import { TimeZoneHandling } from "../Common/StringType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { DateTimeValueType, GenericType } from "src/Common/Type";

export class DateTimeColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, DateTimeValueType> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<DateTimeValueType>) {
        super(entityMeta, type ?? Date);
    }
    public override columnType: DateTimeColumnType = "datetime";
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

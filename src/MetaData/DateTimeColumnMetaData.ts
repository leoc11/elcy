import { DateTimeColumnType } from "../Common/ColumnType";
import { ColumnGeneration, TimeZoneHandling } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class DateTimeColumnMetaData<TE = any> extends ColumnMetaData<TE, Date> {
    public columnType: DateTimeColumnType = "datetime";
    public precision?: number;
    public timeZoneHandling: TimeZoneHandling = "utc";
    public isCreatedDate?: boolean;
    public isModifiedDate?: boolean;
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Date, entityMeta);
    }
    public applyOption(columnMeta: DateTimeColumnMetaData<TE>) {
        if (typeof columnMeta.isCreatedDate !== "undefined")
            this.isCreatedDate = columnMeta.isCreatedDate;
        if (typeof columnMeta.isModifiedDate !== "undefined")
            this.isModifiedDate = columnMeta.isModifiedDate;
        super.applyOption(columnMeta);
        if (typeof columnMeta.timeZoneHandling !== "undefined")
            this.timeZoneHandling = columnMeta.timeZoneHandling;
        if (typeof columnMeta.precision !== "undefined")
            this.precision = columnMeta.precision;
        if (this.isCreatedDate || this.isModifiedDate) {
            this.isReadOnly = true;
            this.generation = ColumnGeneration.Insert;
            if (this.isModifiedDate)
                this.generation |= ColumnGeneration.Update;
        }
    }
}

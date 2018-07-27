import { DateColumnType } from "../Common/ColumnType";
import { DateTimeKind, ColumnGeneration } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class DateColumnMetaData<TE = any> extends ColumnMetaData<TE, Date> {
    public columnType: DateColumnType = "datetime";
    public precision?: number;
    public dateTimeKind = DateTimeKind.UTC;
    public isCreatedDate?: boolean;
    public isModifiedDate?: boolean;
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Date, entityMeta);
    }
    public applyOption(columnMeta: DateColumnMetaData<TE>) {
        if (typeof columnMeta.isCreatedDate !== "undefined")
            this.isCreatedDate = columnMeta.isCreatedDate;
        if (typeof columnMeta.isModifiedDate !== "undefined")
            this.isModifiedDate = columnMeta.isModifiedDate;
        super.applyOption(columnMeta);
        if (this.isCreatedDate || this.isModifiedDate) {
            this.isReadOnly = true;
            this.generation = ColumnGeneration.Insert;
            if (this.isModifiedDate)
                this.generation |= ColumnGeneration.Update;
        }
    }
}

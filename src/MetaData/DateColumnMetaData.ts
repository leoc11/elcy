import { DateColumnType } from "../Common/ColumnType";
import { DateTimeKind } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface";
export class DateColumnMetaData<TE = any> extends ColumnMetaData<TE, Date> {
    public columnType: DateColumnType = "datetime";
    public precision?: number;
    public dateTimeKind = DateTimeKind.UTC;
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Date, entityMeta);
    }
}

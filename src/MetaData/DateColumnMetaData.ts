import { DateColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class DateColumnMetaData<TE = any> extends ColumnMetaData<TE, Date> {
    public columnType: DateColumnType = "date";
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Date, entityMeta);
    }
}

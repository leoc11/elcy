import { DateColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class DateColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, Date> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Date, entityMeta);
    }
    public columnType: DateColumnType = "date";
}

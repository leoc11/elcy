import { ColumnMetaData } from "./ColumnMetaData";
import { IDateColumnMetaData } from "./Interface/IDateColumnMetaData";
import { DateTimeKind } from "./Types";
export class DateColumnMetaData extends ColumnMetaData<Date> implements IDateColumnMetaData {
    public columnType: "date" | "datetime";
    public precision: number;
    public dateTimeKind = DateTimeKind.UTC;
    /*
    * UTC TimeZone offset in minute.
    */
    public timezoneOffset: number;
    constructor() {
        super(Date);
    }
}

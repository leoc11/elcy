import { ColumnMetaData } from "./ColumnMetaData";
import { IDateColumnMetaData } from "./Interface/IDateColumnMetaData";
import { dateTimeKind } from "./Types";
export class DateColumnMetaData extends ColumnMetaData<Date> implements IDateColumnMetaData {
    public columnType: "date" | "datetime";
    public precision: number;
    public dateTimeKind: dateTimeKind;
    /*
    * UTC TimeZone offset in minute.
    */
    public timezoneOffset: number;
    constructor() {
        super(Date);
    }
}

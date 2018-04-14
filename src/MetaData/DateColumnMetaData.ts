import { DateColumnType } from "../Common/ColumnType";
import { DateTimeKind } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
export class DateColumnMetaData extends ColumnMetaData<Date> {
    public columnType: DateColumnType = "datetime";
    public precision?: number;
    public dateTimeKind = DateTimeKind.UTC;
    /*
    * UTC TimeZone offset in minute.
    */
    public timezoneOffset: number;
    constructor() {
        super(Date);
    }
}

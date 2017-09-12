import { ColumnMetaData } from "./ColumnMetaData";
export class StringColumnMetaData extends ColumnMetaData<string> {
    public maxLength?: number;
    public dbtype: "nvarchar" | "varchar";
    /*
    * UTC TimeZone offset in minute.
    */
    public timezoneOffset: number;
    constructor() {
        super(String);
    }
}

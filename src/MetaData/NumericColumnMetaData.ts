import { ColumnMetaData } from "./ColumnMetaData";
export class NumericColumnMetaData extends ColumnMetaData<any> {
    public autoIncrement: boolean;
    public dbtype: "decimal" | "bigint" | "int" | "tinyint" | "smallint";
    /*
    * UTC TimeZone offset in minute.
    */
    public timezoneOffset: number;
    constructor() {
        super(Number);
    }
}

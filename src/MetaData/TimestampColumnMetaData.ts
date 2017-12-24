import { TimestampColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";

// TODO: change suitable timestamp value type.
export class TimestampColumnMetaData extends ColumnMetaData<string> {
    public columnType: TimestampColumnType = "timestamp";
    constructor() {
        super(String);
    }
}

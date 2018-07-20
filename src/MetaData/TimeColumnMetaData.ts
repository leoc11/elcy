import { TimeColumnType } from "../Common/ColumnType";
import { DateTimeKind } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { TimeSpan } from "../Common/TimeSpan";
export class TimeColumnMetaData extends ColumnMetaData<TimeSpan> {
    public columnType: TimeColumnType = "time";
    public precision?: number;
    public dateTimeKind = DateTimeKind.UTC;
    constructor() {
        super(TimeSpan);
    }
}

import { TimeColumnType } from "../Common/ColumnType";
import { TimeZoneHandling } from "../Common/StringType";
import { TimeSpan } from "../Data/TimeSpan";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { GenericType, TimeValueType } from "src/Common/Type";

export class TimeColumnMetaData<TE extends object = object, T extends TimeValueType = TimeValueType> extends ColumnMetaData<TE, T> {
    constructor(entity?: IEntityMetaData<TE>, type: GenericType<T> = TimeSpan as GenericType<TimeSpan> as GenericType<Extract<TimeSpan, T>>) {
        super(entity, type);
    }
    public override columnType: TimeColumnType = "time";
    public precision?: number;
    public timeZoneHandling: TimeZoneHandling = "utc";
    public override applyOption(columnMeta: TimeColumnMetaData<TE, T>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.timeZoneHandling !== "undefined") {
            this.timeZoneHandling = columnMeta.timeZoneHandling;
        }
        if (typeof columnMeta.precision !== "undefined") {
            this.precision = columnMeta.precision;
        }
    }
}

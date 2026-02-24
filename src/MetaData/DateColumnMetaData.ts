import { GenericType } from "src/Common/Type";
import { DateColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import type { Temporal } from "@js-temporal/polyfill";
export class DateColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, Date | Temporal.PlainDate> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<Date> | GenericType<Temporal.PlainDate>) {
        super(entityMeta, type ?? Date);
    }
    public columnType: DateColumnType = "date";
}

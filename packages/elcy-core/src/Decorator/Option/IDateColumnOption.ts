import type { Temporal } from "@js-temporal/polyfill";
import { DateColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { GenericType } from "src/Common/Type";
// tslint:disable-next-line:ban-types
export interface IDateColumnOption extends IColumnOption<Date | Temporal.PlainDate> {
    columnType?: DateColumnType;
    precision?: number;
    type?: GenericType<Date> | GenericType<Temporal.PlainDate>;
}

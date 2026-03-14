import type { Temporal } from "@js-temporal/polyfill";
import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function DateTimeColumn<TE extends object, T extends Date | Temporal.Instant>(option?: IDateTimeColumnOption): ClassPropertyDecorator<TE, Date | Temporal.Instant>;
export function DateTimeColumn<TE extends object, T extends Date | Temporal.Instant>(name: string, dbtype?: DateTimeColumnType, defaultValue?: () => Date, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, Date | Temporal.Instant>;
export function DateTimeColumn<TE extends object, T extends Date | Temporal.Instant>(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, defaultValue?: () => T, timeZoneHanding?: TimeZoneHandling):ClassPropertyDecorator<TE, Date | Temporal.Instant> {
    let option: IDateTimeColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (defaultValue !== undefined) {
            option.default = defaultValue;
        }
        if (dbtype !== undefined) {
            option.columnType = dbtype;
        }
        if (timeZoneHanding !== undefined) {
            option.timeZoneHandling = timeZoneHanding;
        }
    }
    else if (optionOrName) {
        option = optionOrName;
    }

    return Column<TE, Date | Temporal.Instant>(option.type ?? Date, DateTimeColumnMetaData, option);
}

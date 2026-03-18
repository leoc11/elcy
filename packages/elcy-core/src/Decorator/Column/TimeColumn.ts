import type { Temporal } from "@js-temporal/polyfill";
import { TimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { TimeSpan } from "../../Data/TimeSpan";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { ITimeColumnOption } from "../Option/ITimeColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function TimeColumn<TE extends object, T extends TimeSpan | Temporal.PlainTime>(option?: ITimeColumnOption): ClassPropertyDecorator<TE, TimeSpan | Temporal.PlainTime>;
export function TimeColumn<TE extends object, T extends TimeSpan | Temporal.PlainTime>(name: string, dbtype?: TimeColumnType, defaultValue?: () => T, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, TimeSpan | Temporal.PlainTime>;
export function TimeColumn<TE extends object, T extends TimeSpan | Temporal.PlainTime>(optionOrName?: ITimeColumnOption | string, dbtype?: TimeColumnType, defaultValue?: () => T, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, TimeSpan | Temporal.PlainTime> {
    let option: ITimeColumnOption = {};
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

    return Column<TE, TimeSpan | Temporal.PlainTime>(option.type ?? TimeSpan, TimeColumnMetaData, option);
}

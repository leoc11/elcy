import type { Temporal } from "@js-temporal/polyfill";
import { DateColumnType } from "../../Common/ColumnType";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function DateColumn<TE extends object, T extends Date | Temporal.PlainDate>(option?: IDateColumnOption): ClassPropertyDecorator<TE, Date | Temporal.PlainDate>;
export function DateColumn<TE extends object, T extends Date | Temporal.PlainDate>(name: string, dbtype?: DateColumnType, defaultValue?: () => T): ClassPropertyDecorator<TE, Date | Temporal.PlainDate>;
export function DateColumn<TE extends object, T extends Date | Temporal.PlainDate>(optionOrName?: IDateColumnOption | string, dbtype?: DateColumnType, defaultValue?: () => T): ClassPropertyDecorator<TE, Date | Temporal.PlainDate> {
    let option: IDateColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (defaultValue !== undefined) {
            option.default = defaultValue;
        }
        if (dbtype !== undefined) {
            option.columnType = dbtype;
        }
    }
    else if (optionOrName) {
        option = optionOrName;
    }

    return Column<TE, Date | Temporal.PlainDate>(option.type ?? Date, DateColumnMetaData, option);
}

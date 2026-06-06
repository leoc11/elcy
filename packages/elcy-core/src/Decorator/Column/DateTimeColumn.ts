import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";
import { DateTimeValueType } from "src/Common/Type";

export function DateTimeColumn<TE extends object, T extends DateTimeValueType>(option?: IDateTimeColumnOption<T>): ClassPropertyDecorator<TE, DateTimeValueType>;
export function DateTimeColumn<TE extends object, T extends DateTimeValueType>(name: string, dbtype?: DateTimeColumnType, defaultValue?: () => Date, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, DateTimeValueType>;
export function DateTimeColumn<TE extends object, T extends DateTimeValueType>(optionOrName?: IDateTimeColumnOption<T> | string, dbtype?: DateTimeColumnType, defaultValue?: () => T, timeZoneHanding?: TimeZoneHandling):ClassPropertyDecorator<TE, DateTimeValueType> {
    let option: IDateTimeColumnOption<T> = {};
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

    return Column<TE, DateTimeValueType>(option.type ?? Date, DateTimeColumnMetaData, option);
}

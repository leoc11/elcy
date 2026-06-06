import { TimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { TimeSpan } from "../../Data/TimeSpan";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { ITimeColumnOption } from "../Option/ITimeColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";
import { TimeValueType } from "src/Common/Type";

export function TimeColumn<TE extends object, T extends TimeValueType>(option?: ITimeColumnOption<T>): ClassPropertyDecorator<TE, TimeValueType>;
export function TimeColumn<TE extends object, T extends TimeValueType>(name: string, dbtype?: TimeColumnType, defaultValue?: () => T, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, TimeValueType>;
export function TimeColumn<TE extends object, T extends TimeValueType>(optionOrName?: ITimeColumnOption<T> | string, dbtype?: TimeColumnType, defaultValue?: () => T, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, TimeValueType> {
    let option: ITimeColumnOption<T> = {};
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

    return Column<TE, TimeValueType>(option.type ?? TimeSpan, TimeColumnMetaData, option);
}

import { TimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { TimeSpan } from "../../Data/TimeSpan";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { ITimeColumnOption } from "../Option/ITimeColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function TimeColumn<TE extends object, T extends TimeSpan>(option?: ITimeColumnOption): ClassPropertyDecorator<TE, T>;
export function TimeColumn<TE extends object, T extends TimeSpan>(name: string, dbtype?: TimeColumnType, defaultValue?: () => TimeSpan, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, T>;
export function TimeColumn<TE extends object, T extends TimeSpan>(optionOrName?: ITimeColumnOption | string, dbtype?: TimeColumnType, defaultValue?: () => TimeSpan, timeZoneHanding?: TimeZoneHandling): ClassPropertyDecorator<TE, T> {
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

    return Column<TE, T>(TimeColumnMetaData as any, option);
}

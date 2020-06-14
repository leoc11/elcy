import "reflect-metadata";
import { TimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { TimeSpan } from "../../Data/TimeSpan";
import { TimeColumnMetaData } from "../../MetaData/TimeColumnMetaData";
import { ITimeColumnOption } from "../Option/ITimeColumnOption";
import { Column } from "./Column";

export function TimeColumn(option?: ITimeColumnOption): PropertyDecorator;
export function TimeColumn(name: string, dbtype?: TimeColumnType, defaultValue?: () => TimeSpan, timeZoneHanding?: TimeZoneHandling): PropertyDecorator;
export function TimeColumn(optionOrName?: ITimeColumnOption | string, dbtype?: TimeColumnType, defaultValue?: () => TimeSpan, timeZoneHanding?: TimeZoneHandling): PropertyDecorator {
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

    return Column<any, TimeSpan>(TimeColumnMetaData, option);
}

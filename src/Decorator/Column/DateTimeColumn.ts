import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { Column } from "./Column";

export function DateTimeColumn(option?: IDateTimeColumnOption): PropertyDecorator & MethodDecorator;
export function DateTimeColumn(name: string, dbtype?: DateTimeColumnType, defaultValue?: () => Date, timeZoneHanding?: TimeZoneHandling): PropertyDecorator & MethodDecorator;
export function DateTimeColumn(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, defaultValue?: () => Date, timeZoneHanding?: TimeZoneHandling): PropertyDecorator & MethodDecorator {
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

    return Column<any, any, Date>(DateTimeColumnMetaData, option);
}

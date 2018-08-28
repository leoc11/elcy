import "reflect-metadata";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { Column } from "./Column";
import { DateTimeColumnType } from "../../Common/ColumnType";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { TimeZoneHandling } from "../../Common/Type";

export function DateTimeColumn(option?: IDateTimeColumnOption): PropertyDecorator;
export function DateTimeColumn(name: string, dbtype?: DateTimeColumnType, defaultValue?: () => Date, timeZoneHanding?: TimeZoneHandling): PropertyDecorator;
export function DateTimeColumn(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, defaultValue?: () => Date, timeZoneHanding?: TimeZoneHandling): PropertyDecorator {
    let option: IDateTimeColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (defaultValue !== undefined) option.default = defaultValue;
        if (dbtype !== undefined) option.columnType = dbtype;
        if (timeZoneHanding !== undefined) option.timeZoneHandling = timeZoneHanding;
    }
    else if (optionOrName) {
        option = optionOrName;
    }

    return Column<any, Date>(DateColumnMetaData, option);
}

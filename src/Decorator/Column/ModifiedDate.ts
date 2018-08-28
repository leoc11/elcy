import "reflect-metadata";
import { TimeZoneHandling } from "../../Common/Type";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { Column } from "./Column";
import { DateTimeColumnType } from "../../Common/ColumnType";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";

export function ModifiedDate(option: IDateTimeColumnOption): PropertyDecorator;
export function ModifiedDate(name: string, dbtype: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator;
export function ModifiedDate(optionOrName: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator {
    let option: IDateTimeColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (timeZoneHandling !== undefined) option.timeZoneHandling = timeZoneHandling;
        if (dbtype !== undefined) option.columnType = dbtype;
    }
    else if (optionOrName) {
        option = optionOrName;
    }
    option.isModifiedDate = true;
    option.default = () => Date.currentTimestamp();
    return Column<any, Date>(DateColumnMetaData, option);
}

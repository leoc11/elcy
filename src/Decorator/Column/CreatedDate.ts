import { TimeZoneHandling } from "../../Common/Type";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { Column } from "./Column";
import { DateTimeColumnType } from "../../Common/ColumnType";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";

export function CreatedDate(option?: IDateTimeColumnOption): PropertyDecorator;
export function CreatedDate(name: string, dbtype: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator;
export function CreatedDate(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator {
    let option: IDateTimeColumnOption;
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (timeZoneHandling !== undefined) option.timeZoneHandling = timeZoneHandling;
        if (dbtype !== undefined) option.columnType = dbtype;
    }
    else {
        option = optionOrName;
    }
    option.isCreatedDate = true;
    option.default = () => Date.currentTimestamp();
    return Column<any, Date>(DateColumnMetaData, option);
}

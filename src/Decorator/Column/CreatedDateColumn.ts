import { DateTimeColumnType } from "../../Common/ColumnType";
import { TimeZoneHandling } from "../../Common/StringType";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { Column } from "./Column";

export function CreatedDateColumn(option?: IDateTimeColumnOption): PropertyDecorator;
export function CreatedDateColumn(name: string, dbtype: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator;
export function CreatedDateColumn(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator {
    let option: IDateTimeColumnOption = {};
    if (optionOrName) {
        if (typeof optionOrName === "string") {
            option.columnName = optionOrName;
            if (timeZoneHandling !== undefined) {
                option.timeZoneHandling = timeZoneHandling;
            }
            if (dbtype !== undefined) {
                option.columnType = dbtype;
            }
        }
        else {
            option = optionOrName;
        }
    }
    option.isCreatedDate = true;
    if (option.timeZoneHandling === "none") {
        /* istanbul ignore next */
        option.default = () => Date.timestamp();
    }
    else {
        /* istanbul ignore next */
        option.default = () => Date.utcTimestamp();
    }
    return Column<any, Date>(DateTimeColumnMetaData, option);
}

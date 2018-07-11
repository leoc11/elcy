import { DateTimeKind } from "../../Common/Type";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { Column } from "../Column/Column";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { DateColumnType } from "../../Common/ColumnType";

export function CreatedDate(option?: IDateColumnOption): PropertyDecorator;
export function CreatedDate(name: string, dbtype: DateColumnType, dateTimeKind: DateTimeKind): PropertyDecorator;
export function CreatedDate(optionOrName?: IDateColumnOption | string, dbtype?: DateColumnType, dateTimeKind?: DateTimeKind): PropertyDecorator {
    let option: IDateColumnOption;
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (dateTimeKind !== undefined) option.dateTimeKind = dateTimeKind;
        if (dbtype !== undefined) option.columnType = dbtype;
    }
    else {
        option = optionOrName;
    }
    option.isCreatedDate = true;
    return Column<any, Date>(DateColumnMetaData, option);
}

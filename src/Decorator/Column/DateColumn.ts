import "reflect-metadata";
import { DateTimeKind } from "../../Common/Type";
import { DateColumnMetaData } from "../../MetaData";
import { Column } from "./Column";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { DateColumnType } from "../../Common/ColumnType";

export function DateColumn(option?: IDateColumnOption): PropertyDecorator;
export function DateColumn(name: string, dbtype?: DateColumnType, dateTimeKind?: DateTimeKind, defaultValue?: () => Date): PropertyDecorator;
export function DateColumn(optionOrName?: IDateColumnOption | string, dbtype?: DateColumnType, dateTimeKind?: DateTimeKind, defaultValue?: () => Date): PropertyDecorator {
    let option: IDateColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (defaultValue !== undefined) option.default = defaultValue;
        if (dateTimeKind !== undefined) option.dateTimeKind = dateTimeKind;
        if (dbtype !== undefined) option.columnType = dbtype;
    }
    else if (optionOrName) {
        option = optionOrName;
    }

    return Column<any, Date>(DateColumnMetaData, option);
}

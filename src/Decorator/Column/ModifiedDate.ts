import "reflect-metadata";
import { DateTimeKind } from "../../Common/Type";
import { DateColumnMetaData } from "../../MetaData";
import { Column } from "./Column";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { DateColumnType } from "../../Common/ColumnType";

export function ModifiedDate(option: IDateColumnOption): PropertyDecorator;
export function ModifiedDate(timezoneOffset: number): PropertyDecorator;
export function ModifiedDate(name: string, dbtype: DateColumnType, dateTimeKind: DateTimeKind, timezoneOffset: number, defaultValue?: Date): PropertyDecorator;
export function ModifiedDate(name: string | number | IDateColumnOption, dbtype?: DateColumnType, dateTimeKind?: DateTimeKind, timezoneOffset?: number, defaultValue?: Date): PropertyDecorator {
    const metadata = new DateColumnMetaData();
    if (typeof (name) === "number") {
        metadata.timezoneOffset = name;
        metadata.dateTimeKind = DateTimeKind.Custom;
    }
    else if (typeof name === "string") {
        metadata.columnName = name;
        if (defaultValue !== undefined) metadata.default = defaultValue;
        if (dateTimeKind !== undefined) metadata.dateTimeKind = dateTimeKind;
        if (dbtype !== undefined) metadata.columnType = dbtype;
        if (timezoneOffset !== undefined) metadata.timezoneOffset = timezoneOffset;
    }
    else if (name) {
        metadata.applyOption(name);
    }
    return Column(metadata, { isModifiedDate: true });
}

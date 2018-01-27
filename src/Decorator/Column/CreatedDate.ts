import { DateTimeKind } from "../../Common/Type";
import { DateColumnMetaData } from "../../MetaData";
import { Column } from "../Column/Column";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { DateColumnType } from "../../Common/ColumnType";

export function CreatedDate(option?: IDateColumnOption): PropertyDecorator;
export function CreatedDate(timezoneOffset: number): PropertyDecorator;
export function CreatedDate(name: string, dbtype: DateColumnType, dateTimeKind: DateTimeKind, timezoneOffset: number, defaultValue?: Date): PropertyDecorator;
export function CreatedDate(name?: string | number | IDateColumnOption, dbtype?: DateColumnType, dateTimeKind?: DateTimeKind, timezoneOffset?: number, defaultValue?: Date): PropertyDecorator {
    const metadata = new DateColumnMetaData();
    if (typeof name === "number") {
        metadata.timezoneOffset = name;
        metadata.dateTimeKind = DateTimeKind.Custom;
    }
    else if (typeof name === "string") {
        metadata.name = name;
        if (defaultValue !== undefined) metadata.default = defaultValue;
        if (dateTimeKind !== undefined) metadata.dateTimeKind = dateTimeKind;
        if (dbtype !== undefined) metadata.columnType = dbtype;
        if (timezoneOffset !== undefined) metadata.timezoneOffset = timezoneOffset;
    }
    else if (name) {
        metadata.applyOption(name);
    }

    return Column(metadata, { isCreatedDate: true });
}

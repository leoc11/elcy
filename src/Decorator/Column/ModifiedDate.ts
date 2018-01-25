import "reflect-metadata";
import { DateTimeKind } from "../../Common/Type";
import { DateColumnMetaData } from "../../MetaData";
import { Column } from "./Column";

export function ModifiedDate(timezoneOffset: number): PropertyDecorator;
export function ModifiedDate(name: string, dbtype: "date" | "datetime", dateTimeKind: DateTimeKind, timezoneOffset: number, defaultValue?: Date): PropertyDecorator;
export function ModifiedDate(name: string | number = "", dbtype: "date" | "datetime" = "datetime", dateTimeKind = DateTimeKind.UTC, timezoneOffset = 0, defaultValue?: Date): PropertyDecorator {
    const metadata = new DateColumnMetaData();
    if (typeof (name) === "number") {
        timezoneOffset = name;
        dateTimeKind = DateTimeKind.Custom;
        metadata.columnType = dbtype;
        metadata.timezoneOffset = timezoneOffset;
    }
    else {
        metadata.name = name;
    }

    if (defaultValue !== undefined) {
        metadata.default = defaultValue;
    }

    metadata.dateTimeKind = dateTimeKind;
    metadata.columnType = dbtype;
    metadata.timezoneOffset = timezoneOffset;

    return Column(metadata, { isModifiedDate: true });
}

import { DateColumnMetaData } from "../MetaData";
import { DateTimeKind } from "../MetaData/Types";
import { Column } from "./Column";

export function CreatedDate(timezoneOffset: number): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function CreatedDate(name: string, dbtype: "date" | "datetime", dateTimeKind: DateTimeKind, timezoneOffset: number, defaultValue?: Date): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function CreatedDate(name: string | number = "", dbtype: "date" | "datetime" = "datetime", dateTimeKind = DateTimeKind.UTC, timezoneOffset = 0, defaultValue?: Date): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
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
    return Column(metadata, { isCreatedDate: true });
}

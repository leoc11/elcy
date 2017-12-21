import { ColumnMetaData, DateColumnMetaData } from "../MetaData";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { dateTimeKind } from "../MetaData/Types";
import { columnMetaKey, entityMetaKey } from "./DecoratorKey";

export function CreatedDateColumn(timezoneOffset: number): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function CreatedDateColumn(name: string, dbtype: "date" | "datetime", dateTimeKind: dateTimeKind, timezoneOffset: number, defaultValue?: Date): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function CreatedDateColumn(name: string | number = "", dbtype: "date" | "datetime" = "datetime", dateTimeKind: dateTimeKind = "utc", timezoneOffset = 0, defaultValue?: Date): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new DateColumnMetaData();
    if (typeof (name) === "number") {
        timezoneOffset = name;
        dateTimeKind = "custom";
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

    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        const entityMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target);
        if (entityMetaData) {
            entityMetaData.createDateProperty = propertyKey;
            if (entityMetaData.members.indexOf(propertyKey) < 0) {
                entityMetaData.members.push(propertyKey);
            }
        }

        if (!metadata.name) {
            if (typeof (propertyKey) === "string")
                metadata.name = propertyKey;
        }

        const columnMetaData: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, target, propertyKey);
        if (columnMetaData != null) {
            metadata.Copy(columnMetaData);
        }
        Reflect.defineMetadata(columnMetaKey, metadata, target, propertyKey);
    };
}

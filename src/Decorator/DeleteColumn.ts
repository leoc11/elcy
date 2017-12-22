import "reflect-metadata";
import { BooleanColumnMetaData, ColumnMetaData } from "../MetaData";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { columnMetaKey, entityMetaKey } from "./DecoratorKey";

export function DeleteColumn(name?: string, defaultValue?: boolean): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new BooleanColumnMetaData();
    if (typeof name !== "undefined")
        metadata.name = name;
    if (typeof defaultValue !== "undefined")
        metadata.default = defaultValue;

    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        const entityMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (entityMetaData) {
            entityMetaData.deleteProperty = propertyKey;
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

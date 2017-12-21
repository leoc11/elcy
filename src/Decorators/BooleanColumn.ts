import "reflect-metadata";
import { BooleanColumnMetaData, ColumnMetaData } from "../MetaData";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { IBooleanColumnMetaData } from "../MetaData/Interface";
import { columnMetaKey, entityMetaKey } from "./DecoratorKey";

export function BooleanColumn(option: IBooleanColumnMetaData): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
// tslint:disable-next-line:ban-types
export function BooleanColumn(name?: string | IBooleanColumnMetaData, defaultValue?: boolean): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new BooleanColumnMetaData();
    if (name instanceof BooleanColumnMetaData) {
        metadata.Copy(name);
    }
    else {
        if (typeof name !== "undefined")
            metadata.name = name as string;
        if (typeof defaultValue !== "undefined")
            metadata.default = defaultValue;
    }

    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        const entityMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target);
        if (entityMetaData) {
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

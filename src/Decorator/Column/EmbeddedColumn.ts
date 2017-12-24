import "reflect-metadata";
import { genericType } from "../../Common/Type";
import { EmbeddedColumnMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { columnMetaKey } from "../DecoratorKey";

export function EmbeddedColumn<T>(type: genericType<T>, prefix?: string) {
    return (target: object, propertyKey: string) => {
        const embeddedColumnMetaData = new EmbeddedColumnMetaData(type, prefix || propertyKey);
        Reflect.defineMetadata(columnMetaKey, embeddedColumnMetaData, target.constructor, propertyKey);
    };
}

import "reflect-metadata";
import { GenericType } from "../../Common/Type";
import { EmbeddedColumnMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { columnMetaKey } from "../DecoratorKey";

export function EmbeddedColumn<T>(type: GenericType<T>, prefix?: string): PropertyDecorator {
    return (target: object, propertyKey: string) => {
        const embeddedColumnMetaData = new EmbeddedColumnMetaData(type, prefix || propertyKey);
        Reflect.defineMetadata(columnMetaKey, embeddedColumnMetaData, target.constructor, propertyKey);
    };
}

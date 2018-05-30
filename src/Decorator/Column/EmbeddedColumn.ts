import "reflect-metadata";
import { IObjectType } from "../../Common/Type";
import { EmbeddedColumnMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";

export function EmbeddedColumn<T>(type: IObjectType<T>, prefix?: string): PropertyDecorator {
    return (target: object, propertyKey: string) => {
        const embeddedEntityMeta = Reflect.getMetadata(entityMetaKey, type);
        if (!embeddedEntityMeta) {
            throw new Error(`${type.name} don't have any columns`);
        }
        const embeddedColumnMetaData = new EmbeddedColumnMetaData(embeddedEntityMeta, propertyKey, prefix);
        Reflect.defineMetadata(columnMetaKey, embeddedColumnMetaData, target.constructor, propertyKey);
    };
}

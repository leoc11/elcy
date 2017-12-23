import "reflect-metadata";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { entityMetaKey } from "./DecoratorKey";

export function PrimaryKey(): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    return (target: object, propertyKey: string /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        const entityMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target);
        if (entityMetaData) {
            if (entityMetaData.primaryKeys.indexOf(propertyKey) < 0)
                entityMetaData.primaryKeys.push(propertyKey);
        }
        Reflect.defineMetadata(entityMetaKey, entityMetaData, target);
    };
}

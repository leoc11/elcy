import "reflect-metadata";
import { EntityMetaData, UniqueMetaData } from "../MetaData";
import { entityMetaKey } from "./DecoratorKey";

export function UniqueColumn(name: string): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    return (target: object, propertyKey: string /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        if (!name)
            name = "IX_UQ_" + propertyKey;

        let entityMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (entityMetaData == null) {
            entityMetaData = new EntityMetaData(() => target);
        }
        let uniqueMetaData = entityMetaData.uniques[name];
        if (uniqueMetaData == null) {
            uniqueMetaData = new UniqueMetaData(name);
            entityMetaData.uniques[name] = uniqueMetaData;
        }

        if (!uniqueMetaData.members.contains(propertyKey)) {
            uniqueMetaData.members.push(propertyKey);
        }
        Reflect.defineMetadata(entityMetaKey, entityMetaData, target);
    };
}

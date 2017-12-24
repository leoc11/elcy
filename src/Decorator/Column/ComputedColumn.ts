import "reflect-metadata";
import { genericType } from "../../Common/Type";
import { AbstractEntityMetaData, ComputedColumnMetaData } from "../../MetaData";
import { IEntityMetaData } from "../../MetaData/Interface";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";

export function ComputedColumn<T, R>(type: genericType<R>, fn: (o: T) => R) {
    return (target: T, propertyKey: string /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        const computedMetaData = new ComputedColumnMetaData(type, fn, propertyKey);
        let entityMetaData: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as genericType<T>);
            Reflect.defineMetadata(entityMetaKey, entityMetaData, target);
        }
        if (entityMetaData.computedProperties.contains(computedMetaData.name))
            entityMetaData.computedProperties.push(computedMetaData.name);
        Reflect.defineMetadata(columnMetaKey, computedMetaData, target.constructor, propertyKey);
    };
}

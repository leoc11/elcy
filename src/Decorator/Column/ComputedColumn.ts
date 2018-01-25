import "reflect-metadata";
import { genericType } from "../../Common/Type";
import { AbstractEntityMetaData, ComputedColumnMetaData } from "../../MetaData";
import { IEntityMetaData } from "../../MetaData/Interface";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";

export function ComputedColumn<T, R>(type: genericType<R>, fn: (o: T) => R): PropertyDecorator {
    return (target: T, propertyKey: string /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        const computedMetaData = new ComputedColumnMetaData(type, fn, propertyKey);
        let entityMetaData: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as genericType<T>);
            Reflect.defineMetadata(entityMetaKey, entityMetaData, target);
        }
        if (entityMetaData.computedProperties.contain(computedMetaData.name))
            entityMetaData.computedProperties.push(computedMetaData.name);
        Reflect.defineMetadata(columnMetaKey, computedMetaData, target.constructor, propertyKey);

        const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        if (descriptor) {
            descriptor.set = (value: R) => {
                descriptor.value = value;
            };
            descriptor.get = function(this: T) {
                if (typeof descriptor.value === "undefined") {
                    try {
                        return fn(this);
                    } catch (e) {
                        // console.log(e);
                    }
                }
                return descriptor.value;
            };
            descriptor.configurable = true;
            descriptor.enumerable = true;
            descriptor.writable = undefined;
            descriptor.value = undefined;
        }
        else {
            throw new Error("Computed column decorator not supported");
        }
    };
}

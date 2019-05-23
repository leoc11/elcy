import "reflect-metadata";
import { IObjectType } from "../../Common/Type";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { ISaveEventParam } from "../../MetaData/Interface/ISaveEventParam";
import { entityMetaKey } from "../DecoratorKey";
import { AbstractEntity } from "../Entity/AbstractEntity";
/**
 * Register before save event. only for concrete
 * @handler: if named function was passed, then it will override last function with the same name
 */
export function BeforeSave<T = any>(handler?: (this: T, item?: ISaveEventParam) => boolean): MethodDecorator & ClassDecorator {
    return (target: object | IObjectType<T>, propertyKey?: keyof T, descriptor?: PropertyDescriptor) => {
        const ctor = (propertyKey ? target.constructor : target) as ObjectConstructor;
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, ctor);
        if (!entityMetaData) {
            AbstractEntity()(ctor);
            entityMetaData = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        }

        if (!handler && descriptor && typeof descriptor.value === "function") {
            handler = descriptor.value;
        }

        if (handler) {
            entityMetaData.beforeSave = handler;
        }
    };
}

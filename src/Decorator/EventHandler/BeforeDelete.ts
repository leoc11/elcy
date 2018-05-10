import "reflect-metadata";
import { IObjectType } from "../../Common/Type";
import { IDeleteEventParam, IEntityMetaData } from "../../MetaData/Interface";
import { entityMetaKey } from "../DecoratorKey";
import { AbstractEntity } from "../Entity/AbstractEntity";
/**
 * Register before save event. only for concrete entity
 */
export function BeforeDelete<T = any>(handler?: (this: T, param?: IDeleteEventParam) => boolean): MethodDecorator | ClassDecorator {
    return (target: object | IObjectType<T>, propertyKey?: string /* | symbol*/, descriptor?: PropertyDescriptor) => {
        const ctor = (propertyKey ? target.constructor : target) as ObjectConstructor;
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, ctor);
        if (!entityMetaData) {
            AbstractEntity()(ctor);
            entityMetaData = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        }

        if (!handler && descriptor && typeof descriptor.value === "function")
            handler = descriptor.value;

        if (handler)
            entityMetaData.beforeDelete = handler;
    };
}

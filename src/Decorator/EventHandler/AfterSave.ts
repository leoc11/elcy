import "reflect-metadata";
import { IObjectType } from "../../Common/Type";
import { EntityMetaData } from "../../MetaData";
import { IEntityMetaData, ISaveEventParam } from "../../MetaData/Interface";
import { entityMetaKey } from "../DecoratorKey";
/**
 * Register before save event. only for concrete entity
 */
export function AfterSave<T = any>(handler?: (this: T, param: ISaveEventParam) => void): MethodDecorator | ClassDecorator {
    return (target: object | IObjectType<T>, propertyKey?: string /* | symbol*/, descriptor?: PropertyDescriptor) => {
        const entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, propertyKey ? target.constructor : target);
        if (!(entityMetaData instanceof EntityMetaData))
            return;

        if (!handler && descriptor && typeof descriptor.value === "function")
            handler = descriptor.value;

        if (handler)
            entityMetaData.afterSave.add(handler);
    };
}

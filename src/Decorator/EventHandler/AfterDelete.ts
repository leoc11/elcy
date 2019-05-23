import "reflect-metadata";
import { IObjectType } from "../../Common/Type";
import { IDeleteEventParam } from "../../MetaData/Interface/IDeleteEventParam";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { entityMetaKey } from "../DecoratorKey";
import { AbstractEntity } from "../Entity/AbstractEntity";
/**
 * Register before save event. only for concrete entity
 */
export function AfterDelete<TE = any>(handler?: (this: TE, item?: IDeleteEventParam) => void): MethodDecorator & ClassDecorator {
    return (target: object | IObjectType<TE>, propertyKey?: keyof TE, descriptor?: PropertyDescriptor) => {
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
            entityMetaData.afterDelete = handler;
        }
    };
}

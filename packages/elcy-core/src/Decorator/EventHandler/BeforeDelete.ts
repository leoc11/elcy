import { IObjectType, StringKeyOf } from "../../Common/Type";
import { IDeleteEventParam } from "../../MetaData/Interface/IDeleteEventParam";
import { getEntityMetadata } from "../../MetaData/MetaDataMapper";
import { AbstractEntity } from "../Entity/AbstractEntity";
/**
 * Register before save event. only for concrete entity
 */
export function BeforeDelete<TE extends object = object>(handler?: (item: TE, param?: IDeleteEventParam) => boolean): MethodDecorator & ClassDecorator {
    return (target: object | IObjectType<TE>, propertyKey?: StringKeyOf<TE>, descriptor?: PropertyDescriptor) => {
        const ctor = (propertyKey ? target.constructor : target) as IObjectType<TE>;
        let entityMetaData = getEntityMetadata(ctor);
        if (!entityMetaData) {
            AbstractEntity()(ctor);
            entityMetaData = getEntityMetadata(ctor);
        }

        if (!handler && descriptor && typeof descriptor.value === "function") {
            handler = descriptor.value;
        }

        if (handler) {
            entityMetaData.beforeDelete = handler;
        }
    };
}

import "reflect-metadata";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/index";
import { entityMetaKey } from "../DecoratorKey";

export function PrimaryKey(): PropertyDecorator {
    return (target: object, propertyKey: string /* | symbol */) => {
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (!entityMetaData) {
            entityMetaData = new AbstractEntityMetaData(target as any);
            Reflect.defineMetadata(entityMetaKey, entityMetaData, target.constructor);
        }

        if (entityMetaData.primaryKeys.indexOf(propertyKey) < 0)
            entityMetaData.primaryKeys.unshift(propertyKey);
    };
}

import "reflect-metadata";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { entityMetaKey } from "./DecoratorKey";

// for multiple ForeignKey mapping use multiple ForeignKeyDecorator
export function ForeignKey<S, T, K>(childEntityType: { new(): T }, sourceKeySelector: (source: S) => K, targetKeySelector: (source: T) => K): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const sourceProperty = sourceKeySelector.toString();
    const targetProperty = targetKeySelector.toString();
    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        const sourceMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target);
        const targetMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, childEntityType);
        const isSourcePrimaryKey = sourceMetaData.primaryKeys.indexOf(sourceProperty) >= 0;
        const isTargetPrimaryKey = targetMetaData.primaryKeys.indexOf(targetProperty) >= 0;
    };
}

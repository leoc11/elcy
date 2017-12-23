import "reflect-metadata";
import { AbstractEntityMetaData } from "../MetaData";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { IColumnMetaData, IEntityMetaData } from "../MetaData/Interface";
import { InheritedColumnMetaData } from "../MetaData/Relation/index";
import { classBase, genericType, InheritanceType, objectType } from "../MetaData/Types";
import { columnMetaKey, entityMetaKey } from "./DecoratorKey";

export function Entity<T extends TParent = any, TParent = any>(name?: string, defaultOrder?: (item: T) => any, allowInheritance = true) {
    return (type: objectType<T>) => {
        if (name)
            name = type.name;

        const entityMetadata = new EntityMetaData(type, name, defaultOrder);
        if (!allowInheritance)
            entityMetadata.descriminatorMember = "";

        const parentType = Reflect.getPrototypeOf(type) as genericType<TParent>;
        if (parentType !== classBase) {
            const parentMetaData: IEntityMetaData<TParent> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            let isInheritance = false;
            if (parentMetaData instanceof AbstractEntityMetaData) {
                if (parentMetaData.inheritance.parentType) {
                    entityMetadata.inheritance.parentType = parentMetaData.inheritance.parentType;
                    entityMetadata.inheritance.inheritanceType = InheritanceType.TablePerClass;
                }
                else {
                    entityMetadata.inheritance.parentType = parentType;
                    entityMetadata.inheritance.inheritanceType = InheritanceType.TablePerConcreteClass;
                }
                if (parentMetaData.primaryKeys.length > 0)
                    entityMetadata.primaryKeys = parentMetaData.primaryKeys;
                isInheritance = true;
            }
            else if (parentMetaData instanceof EntityMetaData && parentMetaData.allowInheritance && parentMetaData.primaryKeys.length > 0) {
                entityMetadata.inheritance.parentType = parentType;
                entityMetadata.inheritance.inheritanceType = InheritanceType.TablePerClass;
                entityMetadata.primaryKeys = parentMetaData.primaryKeys;
                isInheritance = true;
            }
            if (isInheritance) {
                if (parentMetaData.createDateProperty)
                    entityMetadata.createDateProperty = parentMetaData.createDateProperty;
                if (parentMetaData.modifiedDateProperty)
                    entityMetadata.modifiedDateProperty = parentMetaData.modifiedDateProperty;
                if (parentMetaData.deleteProperty)
                    entityMetadata.deleteProperty = parentMetaData.deleteProperty;
                if (parentMetaData.defaultOrder && !entityMetadata.defaultOrder)
                    entityMetadata.defaultOrder = parentMetaData.defaultOrder;

                parentMetaData.properties.forEach((prop) => {
                    if (!entityMetadata.properties.contains(prop)) {
                        entityMetadata.properties.push(prop);
                        let columnMeta: IColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, parentType, prop);
                        if (entityMetadata.inheritance.inheritanceType !== InheritanceType.TablePerConcreteClass)
                            columnMeta = new InheritedColumnMetaData(columnMeta, parentType, prop);
                        Reflect.defineMetadata(columnMetaKey, columnMeta, type, prop);
                    }
                });

                parentMetaData.computedProperties.forEach((prop) => {
                    if (!entityMetadata.computedProperties.contains(prop)) {
                        entityMetadata.computedProperties.push(prop);
                        const columnMeta: IColumnMetaData<TParent> = Reflect.getOwnMetadata(columnMetaKey, parentType, prop);
                        Reflect.defineMetadata(columnMetaKey, columnMeta, type, prop);
                    }
                });
            }
        }
        Reflect.defineMetadata(entityMetaKey, entityMetadata, type);
    };
}

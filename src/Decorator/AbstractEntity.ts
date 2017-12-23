import "reflect-metadata";
import { AbstractEntityMetaData } from "../MetaData";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { IColumnMetaData, IEntityMetaData } from "../MetaData/Interface";
import { InheritedColumnMetaData } from "../MetaData/Relation/index";
import { classBase, InheritanceType, objectType } from "../MetaData/Types";
import { columnMetaKey, entityMetaKey } from "./DecoratorKey";

export function AbstractEntity<T extends TParent = any, TParent = any>(defaultOrder?: (item: T) => any) {
    return (type: objectType<T>) => {
        const entityMetadata = new AbstractEntityMetaData(type, defaultOrder);
        const parentType = Reflect.getPrototypeOf(type) as objectType<TParent>;
        if (parentType !== classBase) {
            const parentMetaData: IEntityMetaData<TParent> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            if (parentMetaData) {
                let isInheritance = false;
                if (parentMetaData instanceof AbstractEntityMetaData) {
                    if (parentMetaData.inheritance.parentType) {
                        entityMetadata.inheritance.parentType = parentMetaData.inheritance.parentType;
                        entityMetadata.inheritance.inheritanceType = InheritanceType.SingleTable;
                        if (parentMetaData.primaryKeys.length > 0)
                            entityMetadata.primaryKeys = parentMetaData.primaryKeys;
                    }
                    else {
                        entityMetadata.inheritance.parentType = parentType;
                        entityMetadata.inheritance.inheritanceType = InheritanceType.None;
                    }
                    isInheritance = true;
                }
                else if (parentMetaData instanceof EntityMetaData && parentMetaData.allowInheritance && parentMetaData.primaryKeys.length > 0) {
                    entityMetadata.inheritance.parentType = parentType;
                    entityMetadata.inheritance.inheritanceType = InheritanceType.SingleTable;
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

                    const inheritedProperties = parentMetaData.properties.except(entityMetadata.properties);
                    inheritedProperties.forEach((prop) => {
                        entityMetadata.properties.push(prop);
                        const columnMeta: IColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, parentType, prop);
                        const inheritColumnMeta = new InheritedColumnMetaData(columnMeta, parentType, prop);
                        Reflect.defineMetadata(columnMetaKey, inheritColumnMeta, type, prop);
                    });
                    if (entityMetadata.inheritance.inheritanceType !== InheritanceType.None) {
                        const additionProperties = entityMetadata.properties.except(parentMetaData.properties);
                        additionProperties.forEach((prop) => {
                            const columnMeta: IColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, type, prop);
                            const inheritColumnMeta = new InheritedColumnMetaData(columnMeta, parentType, prop);
                            Reflect.defineMetadata(columnMetaKey, inheritColumnMeta, type, prop);
                            Reflect.defineMetadata(columnMetaKey, columnMeta, parentType, prop);
                        });
                    }

                    parentMetaData.computedProperties.forEach((prop) => {
                        if (!entityMetadata.computedProperties.contains(prop)) {
                            entityMetadata.computedProperties.push(prop);
                            const columnMeta: IColumnMetaData<TParent> = Reflect.getOwnMetadata(columnMetaKey, parentType, prop);
                            Reflect.defineMetadata(columnMetaKey, columnMeta, type, prop);
                        }
                    });
                }
            }
        }
        Reflect.defineMetadata(entityMetaKey, entityMetadata, type);
    };
}

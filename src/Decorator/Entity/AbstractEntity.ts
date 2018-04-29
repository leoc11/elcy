import "reflect-metadata";
import { ClassBase, InheritanceType, IObjectType } from "../../Common/Type";
import { IColumnOption } from "../../Decorator/Option";
import { AbstractEntityMetaData, ColumnMetaData } from "../../MetaData";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IEntityMetaData, IOrderCondition } from "../../MetaData/Interface";
import { InheritedColumnMetaData } from "../../MetaData/Relation/index";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";

export function AbstractEntity<T extends TParent = any, TParent = any>(name?: string, defaultOrder?: IOrderCondition[]) {
    return (type: IObjectType<T>) => {
        const entityMetadata = new AbstractEntityMetaData(type, name, defaultOrder);
        const parentType = Object.getPrototypeOf(type) as IObjectType<TParent>;
        if (parentType !== ClassBase) {
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

                    const inheritedProperties = parentMetaData.properties.except(entityMetadata.properties).toArray();
                    inheritedProperties.forEach((prop) => {
                        entityMetadata.properties.push(prop);
                        const columnMeta: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, parentType, prop);
                        const inheritColumnMeta = new InheritedColumnMetaData(columnMeta, parentType, prop);
                        Reflect.defineMetadata(columnMetaKey, inheritColumnMeta, type, prop);
                    });
                    if (entityMetadata.inheritance.inheritanceType !== InheritanceType.None) {
                        const additionProperties = entityMetadata.properties.except(parentMetaData.properties).toArray();
                        additionProperties.forEach((prop) => {
                            const columnMeta: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, type, prop);
                            const inheritColumnMeta = new InheritedColumnMetaData(columnMeta, parentType, prop);
                            Reflect.defineMetadata(columnMetaKey, inheritColumnMeta, type, prop);
                            Reflect.defineMetadata(columnMetaKey, columnMeta, parentType, prop);
                        });
                    }

                    parentMetaData.computedProperties.forEach((prop) => {
                        if (!entityMetadata.computedProperties.contains(prop)) {
                            entityMetadata.computedProperties.push(prop);
                            const columnMeta: IColumnOption<TParent> = Reflect.getOwnMetadata(columnMetaKey, parentType, prop);
                            Reflect.defineMetadata(columnMetaKey, columnMeta, type, prop);
                        }
                    });
                }
            }
        }
        Reflect.defineMetadata(entityMetaKey, entityMetadata, type);
    };
}

import "reflect-metadata";
import { ClassBase, InheritanceType, IObjectType } from "../../Common/Type";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import { IOrderOption } from "../Option/IOrderOption";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";

export function AbstractEntity<T extends TParent = any, TParent = any>(name?: string, defaultOrder?: IOrderOption<T>[]) {
    return (type: IObjectType<T>) => {
        const entityMetadata = new AbstractEntityMetaData(type, name);
        if (defaultOrder) {
            entityMetadata.defaultOrder = defaultOrder.select(o => ({
                column: entityMetadata.columns.first(c => c.propertyName === o.property),
                direction: o.direction
            })).toArray();
        }

        const parentType = Object.getPrototypeOf(type) as IObjectType<TParent>;
        if (parentType !== ClassBase) {
            const parentMetaData: IEntityMetaData<TParent> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            if (parentMetaData) {
                let isInheritance = false;
                if (parentMetaData instanceof AbstractEntityMetaData) {
                    if (parentMetaData.inheritance.parent) {
                        entityMetadata.inheritance.parent = parentMetaData.inheritance.parent;
                        entityMetadata.inheritance.inheritanceType = InheritanceType.SingleTable;
                    }
                    else {
                        entityMetadata.inheritance.parent = parentMetaData;
                        entityMetadata.inheritance.inheritanceType = InheritanceType.None;
                    }
                    isInheritance = true;
                }
                else if (parentMetaData instanceof EntityMetaData && parentMetaData.primaryKeys.length > 0) {
                    entityMetadata.inheritance.parent = parentMetaData;
                    entityMetadata.inheritance.inheritanceType = InheritanceType.SingleTable;
                    isInheritance = true;
                }
                if (isInheritance) {
                    parentMetaData.columns.forEach((parentColumnMeta) => {
                        const existing = entityMetadata.columns.first(o => o.propertyName === parentColumnMeta.propertyName);
                        if (existing) {
                            entityMetadata.columns.remove(existing);
                        }

                        const inheritedColumnMeta = new InheritedColumnMetaData(entityMetadata, parentColumnMeta);
                        entityMetadata.columns.push(inheritedColumnMeta);
                        Reflect.defineMetadata(columnMetaKey, inheritedColumnMeta, type, parentColumnMeta.propertyName);
                    });
                    if (entityMetadata.inheritance.inheritanceType !== InheritanceType.None) {
                        const additionProperties = entityMetadata.columns.where(o => parentMetaData.columns.all(p => p.propertyName !== o.propertyName)).toArray();
                        additionProperties.forEach((entityColumnMeta) => {
                            // TODO: don't select this by default.
                            parentMetaData.columns.push(entityColumnMeta);
                        });
                    }

                    if (parentMetaData.primaryKeys.length > 0)
                        entityMetadata.primaryKeys = parentMetaData.primaryKeys.select(o => entityMetadata.columns.first(p => p.propertyName === o.propertyName)).toArray();

                    if (parentMetaData.createDateColumn)
                        entityMetadata.createDateColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.createDateColumn.propertyName);
                    if (parentMetaData.modifiedDateColumn)
                        entityMetadata.modifiedDateColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.modifiedDateColumn.propertyName);
                    if (parentMetaData.deleteColumn)
                        entityMetadata.deleteColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.deleteColumn.propertyName);
                    if (parentMetaData.defaultOrder && !entityMetadata.defaultOrder)
                        entityMetadata.defaultOrder = parentMetaData.defaultOrder;

                    parentMetaData.computedProperties.forEach((parentColumnMeta) => {
                        if (!entityMetadata.computedProperties.any(o => o.propertyName === parentColumnMeta.propertyName)) {
                            const inheritedColumnMeta = new InheritedComputedColumnMetaData(entityMetadata, parentColumnMeta);
                            entityMetadata.computedProperties.push(inheritedColumnMeta);
                            Reflect.defineMetadata(columnMetaKey, inheritedColumnMeta, type, parentColumnMeta.propertyName);
                        }
                    });
                }
            }
        }
        Reflect.defineMetadata(entityMetaKey, entityMetadata, type);
    };
}

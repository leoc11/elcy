import "reflect-metadata";
import { ClassBase, GenericType, InheritanceType, IObjectType } from "../../Common/Type";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import { IOrderOption } from "../Option/IOrderOption";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { toJSON } from "../../Helper/Util";
export function Entity<T extends TParent = any, TParent = any>(name?: string, defaultOrder?: IOrderOption<T>[], allowInheritance = true) {
    return (type: IObjectType<T>) => {
        if (!name)
            name = type.name;

        const entityMetadata = new EntityMetaData(type, name);
        const entityMet: IEntityMetaData<T, any> = Reflect.getOwnMetadata(entityMetaKey, type);
        if (entityMet)
            entityMetadata.applyOption(entityMet);

        if (defaultOrder) {
            entityMetadata.defaultOrder = defaultOrder.select(o => ({
                column: entityMetadata.columns.first(c => c.propertyName === o.property),
                direction: o.direction
            })).toArray();
        }

        if (!allowInheritance)
            entityMetadata.descriminatorMember = "";

        const parentType = Object.getPrototypeOf(type) as GenericType<TParent>;
        if (parentType !== ClassBase) {
            const parentMetaData: IEntityMetaData<TParent> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            let isInheritance = false;
            if (parentMetaData instanceof AbstractEntityMetaData) {
                if (parentMetaData.inheritance.parent) {
                    entityMetadata.inheritance.parent = parentMetaData.inheritance.parent;
                    entityMetadata.inheritance.inheritanceType = InheritanceType.TablePerClass;
                }
                else {
                    entityMetadata.inheritance.parent = parentMetaData;
                    entityMetadata.inheritance.inheritanceType = InheritanceType.TablePerConcreteClass;
                }
                isInheritance = true;
            }
            else if (parentMetaData instanceof EntityMetaData && parentMetaData.allowInheritance && parentMetaData.primaryKeys.length > 0) {
                entityMetadata.inheritance.parent = parentMetaData;
                entityMetadata.inheritance.inheritanceType = InheritanceType.TablePerClass;
                isInheritance = true;
            }
            if (isInheritance) {
                parentMetaData.columns.forEach((parentColumnMeta) => {
                    let columnMeta: IColumnMetaData<T> = entityMetadata.columns.first(p => p.propertyName === parentColumnMeta.propertyName);
                    if (parentColumnMeta instanceof ComputedColumnMetaData) {
                        if (columnMeta) {
                            if (entityMetadata.inheritance.inheritanceType === InheritanceType.TablePerConcreteClass) {
                                columnMeta = new ComputedColumnMetaData<T>();
                                columnMeta.applyOption(parentColumnMeta as any);
                            }
                            else {
                                columnMeta = new InheritedComputedColumnMetaData<T, TParent>(entityMetadata, parentColumnMeta);
                            }
                        }
                    }
                    else {
                        if (entityMetadata.inheritance.inheritanceType === InheritanceType.TablePerConcreteClass) {
                            if (!columnMeta) {
                                columnMeta = new ColumnMetaData<T>(parentColumnMeta.type, entityMetadata);
                                columnMeta.applyOption(parentColumnMeta);
                            }
                        }
                        else {
                            columnMeta = new InheritedColumnMetaData(entityMetadata, parentColumnMeta);
                        }
                    }

                    if (columnMeta) {
                        entityMetadata.columns.push(columnMeta);
                        Reflect.defineMetadata(columnMetaKey, columnMeta, type, parentColumnMeta.propertyName);
                    }
                });

                if (parentMetaData.primaryKeys.length > 0)
                    entityMetadata.primaryKeys = parentMetaData.primaryKeys.select(o => entityMetadata.columns.first(p => p.propertyName === o.propertyName)).toArray();

                if (parentMetaData.createDateColumn)
                    entityMetadata.createDateColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.createDateColumn.propertyName);
                if (parentMetaData.modifiedDateColumn)
                    entityMetadata.modifiedDateColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.modifiedDateColumn.propertyName);
                if (parentMetaData.deletedColumn)
                    entityMetadata.deletedColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.deletedColumn.propertyName);
                if (parentMetaData.defaultOrder && !entityMetadata.defaultOrder)
                    entityMetadata.defaultOrder = parentMetaData.defaultOrder;
            }
        }
        Reflect.defineMetadata(entityMetaKey, entityMetadata, type);

        if (!type.prototype.toJSON) {
            type.prototype.toJSON = toJSON;
        }
    };
}

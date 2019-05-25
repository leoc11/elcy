import "reflect-metadata";
import { ClassBase, GenericType, InheritanceType, IObjectType } from "../../Common/Type";
import { IOrderDefinition } from "../../Enumerable/Interface/IOrderDefinition";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { toJSON } from "../../Helper/Util";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { IEntityOption } from "../Option/IEntityOption";
export function Entity<T extends TParent = any, TParent = any>(option: IEntityOption<T>): ClassDecorator;
export function Entity<T extends TParent = any, TParent = any>(name?: string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean): ClassDecorator;
export function Entity<T extends TParent = any, TParent = any>(optionOrName?: IEntityOption<T> | string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean) {
    const option: IEntityOption<T> = {};
    if (optionOrName) {
        if (typeof optionOrName === "string") {
            option.name = optionOrName;
            option.defaultOrders = defaultOrders || [];
            option.allowInheritance = allowInheritance;
            if (option.allowInheritance === undefined) {
                option.allowInheritance = true;
            }
        }
    }

    return (type: IObjectType<T>) => {
        if (!option.name) {
            option.name = type.name;
        }

        const entityMetadata = new EntityMetaData(type, option.name);
        const entityMet: IEntityMetaData<T, any> = Reflect.getOwnMetadata(entityMetaKey, type);
        if (entityMet) {
            entityMetadata.applyOption(entityMet);
        }

        if (defaultOrders) {
            entityMetadata.defaultOrders = defaultOrders.select((o) => ({
                0: ExpressionBuilder.parse(o[0], [type]),
                1: o[1]
            })).toArray();
        }

        if (!allowInheritance) {
            entityMetadata.descriminatorMember = "";
        }

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
                for (const parentColumnMeta of parentMetaData.columns) {
                    let columnMeta: IColumnMetaData<T> = entityMetadata.columns.first((p) => p.propertyName === parentColumnMeta.propertyName);
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
                }

                if (parentMetaData.primaryKeys.length > 0) {
                    entityMetadata.primaryKeys = parentMetaData.primaryKeys.select((o) => entityMetadata.columns.first((p) => p.propertyName === o.propertyName)).toArray();
                }

                if (parentMetaData.createDateColumn) {
                    entityMetadata.createDateColumn = entityMetadata.columns.first((p) => p.propertyName === parentMetaData.createDateColumn.propertyName) as any;
                }
                if (parentMetaData.modifiedDateColumn) {
                    entityMetadata.modifiedDateColumn = entityMetadata.columns.first((p) => p.propertyName === parentMetaData.modifiedDateColumn.propertyName) as any;
                }
                if (parentMetaData.deletedColumn) {
                    entityMetadata.deletedColumn = entityMetadata.columns.first((p) => p.propertyName === parentMetaData.deletedColumn.propertyName) as any;
                }
                if (parentMetaData.defaultOrders && !entityMetadata.defaultOrders) {
                    entityMetadata.defaultOrders = parentMetaData.defaultOrders;
                }
            }
        }
        Reflect.defineMetadata(entityMetaKey, entityMetadata, type);

        if (!type.prototype.toJSON) {
            type.prototype.toJSON = toJSON;
        }
    };
}

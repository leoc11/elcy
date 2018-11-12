import "reflect-metadata";
import { ClassBase, InheritanceType, IObjectType } from "../../Common/Type";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";
import { toJSON } from "../../Helper/Util";
import { IEntityOption } from "../Option/IEntityOption";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { IOrderDefinition } from "../../Enumerable/Interface/IOrderDefinition";

export function AbstractEntity<T extends TParent = any, TParent = any>(option: IEntityOption<T>): ClassDecorator;
export function AbstractEntity<T extends TParent = any, TParent = any>(name?: string, defaultOrders?: IOrderDefinition<T>[], allowInheritance?: boolean): ClassDecorator;
export function AbstractEntity<T extends TParent = any, TParent = any>(optionOrName?: IEntityOption<T> | string, defaultOrders?: IOrderDefinition<T>[], allowInheritance?: boolean) {
    const option: IEntityOption<T> = {};
    if (optionOrName) {
        if (typeof optionOrName === "string") {
            option.name = optionOrName;
            option.defaultOrders = defaultOrders || [];
            option.allowInheritance = allowInheritance;
            if (option.allowInheritance === undefined) option.allowInheritance = true;
        }
    }

    return (type: IObjectType<T>) => {
        if (!option.name) option.name = type.name;
        const entityMetadata = new AbstractEntityMetaData(type, option.name);

        if (defaultOrders) {
            entityMetadata.defaultOrders =  defaultOrders.select(o => ({
                0: ExpressionBuilder.parse(o[0]),
                1: o[1]
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
                        entityMetadata.createDateColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.createDateColumn.propertyName) as any;
                    if (parentMetaData.modifiedDateColumn)
                        entityMetadata.modifiedDateColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.modifiedDateColumn.propertyName) as any;
                    if (parentMetaData.deletedColumn)
                        entityMetadata.deletedColumn = entityMetadata.columns.first(p => p.propertyName === parentMetaData.deletedColumn.propertyName) as any;
                    if (parentMetaData.defaultOrders && !entityMetadata.defaultOrders)
                        entityMetadata.defaultOrders = parentMetaData.defaultOrders;

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

        if (!type.prototype.toJSON) {
            type.prototype.toJSON = toJSON;
        }
    };
}

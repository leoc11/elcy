import "reflect-metadata";
import { ClassBase, InheritanceType, IObjectType } from "../../Common/Type";
import { IOrderDefinition } from "../../Enumerable/Interface/IOrderDefinition";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { toJSON } from "../../Helper/Util";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { IEntityOption } from "../Option/IEntityOption";

export function AbstractEntity<T extends TParent = any, TParent = any>(option: IEntityOption<T>): ClassDecorator;
export function AbstractEntity<T extends TParent = any, TParent = any>(name?: string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean): ClassDecorator;
export function AbstractEntity<T extends TParent = any, TParent = any>(optionOrName?: IEntityOption<T> | string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean) {
    const option: IEntityOption<T> = {};
    if (optionOrName) {
        if (typeof optionOrName === "string") {
            option.name = optionOrName;
            option.defaultOrders = defaultOrders || [];
            option.allowInheritance = allowInheritance;
            if (option.allowInheritance === undefined) { option.allowInheritance = true; }
        }
    }

    return (type: IObjectType<T>) => {
        if (!option.name) { option.name = type.name; }
        const entityMetadata = new AbstractEntityMetaData(type, option.name);

        if (defaultOrders) {
            entityMetadata.defaultOrders = defaultOrders.select((o) => ({
                0: ExpressionBuilder.parse(o[0], [type]),
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
                    for (const parentColumnMeta of parentMetaData.columns) {
                        const existing = entityMetadata.columns.first((o) => o.propertyName === parentColumnMeta.propertyName);
                        let inheritedColumnMeta: IColumnMetaData<T>;
                        if (parentColumnMeta instanceof ComputedColumnMetaData) {
                            if (!existing) {
                                inheritedColumnMeta = new InheritedComputedColumnMetaData(entityMetadata, parentColumnMeta);
                            }
                        }
                        else {
                            if (existing) {
                                entityMetadata.columns.delete(existing);
                            }
                            inheritedColumnMeta = new InheritedColumnMetaData(entityMetadata, parentColumnMeta);
                        }

                        if (inheritedColumnMeta) {
                            entityMetadata.columns.push(inheritedColumnMeta);
                            Reflect.defineMetadata(columnMetaKey, inheritedColumnMeta, type, parentColumnMeta.propertyName);
                        }
                    }
                    if (entityMetadata.inheritance.inheritanceType !== InheritanceType.None) {
                        const additionProperties = entityMetadata.columns.where((o) => parentMetaData.columns.all((p) => p.propertyName !== o.propertyName)).toArray();
                        for (const columnMeta of additionProperties) {
                            // TODO
                            parentMetaData.columns.push(columnMeta as unknown as IColumnMetaData);
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
        }
        Reflect.defineMetadata(entityMetaKey, entityMetadata, type);

        if (!type.prototype.toJSON) {
            type.prototype.toJSON = toJSON;
        }
    };
}

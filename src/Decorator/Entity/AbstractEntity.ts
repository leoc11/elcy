import { ClassBase } from "../../Common/Constant";
import { InheritanceType } from "../../Common/Enum";
import { OrderDirection } from "../../Common/StringType";
import { IObjectType, ValueType } from "../../Common/Type";
import { IOrderDefinition } from "@elcy/enumerable";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { getEntityMetadata, setColumnMetadata, setEntityMetadata } from "../../MetaData/MetaDataMapper";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import { IEntityOption } from "../Option/IEntityOption";

export function AbstractEntity<T extends TParent = any, TParent extends object = object>(option: IEntityOption<T>): ClassDecorator;
export function AbstractEntity<T extends TParent = any, TParent extends object = object>(name?: string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean): ClassDecorator;
export function AbstractEntity<T extends TParent = any, TParent extends object = object>(optionOrName?: IEntityOption<T> | string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean) {
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
        const entityMetadata = new AbstractEntityMetaData(type, option.name);

        if (defaultOrders) {
            entityMetadata.defaultOrders = defaultOrders.map((o) => new ArrayValueExpression<OrderDirection | ((...param: T[]) => ValueType)>(ExpressionBuilder.parse(o[0], [type]), new ValueExpression(o[1])));
        }

        const parentType = Object.getPrototypeOf(type) as IObjectType<TParent>;
        if (parentType !== ClassBase) {
            const parentMetaData = getEntityMetadata(parentType);
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
                            setColumnMetadata(type, parentColumnMeta.propertyName, inheritedColumnMeta as any);
                        }
                    }
                    if (entityMetadata.inheritance.inheritanceType !== InheritanceType.None) {
                        const additionProperties = entityMetadata.columns.where((o) => parentMetaData.columns.all((p) => p.propertyName !== o.propertyName));
                        for (const columnMeta of additionProperties) {
                            // TODO
                            parentMetaData.columns.push(columnMeta as unknown as IColumnMetaData<TParent>);
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
        setEntityMetadata(type, entityMetadata);
    };
}

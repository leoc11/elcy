import { ClassBase } from "../../Common/Constant";
import { InheritanceType } from "../../Common/Enum";
import type { IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import type { IOrderDefinition } from "../../Enumerable/Interface/IOrderDefinition";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import type { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import type { IEntityOption } from "../Option/IEntityOption";
import type { OrderDirection } from "../../Common/StringType";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { getEntityMetadata, setColumnMetadata, setEntityMetadata } from "../../MetaData/MetaDataMapper";

export function Entity<T extends TParent, TParent extends object = object>(option: IEntityOption<T>): ClassDecorator;
export function Entity<T extends TParent, TParent extends object = object>(name?: string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean): ClassDecorator;
export function Entity<T extends TParent, TParent extends object = object>(optionOrName?: IEntityOption<T> | string, defaultOrders?: Array<IOrderDefinition<T>>, allowInheritance?: boolean) {
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
        const entityMet = getEntityMetadata(type);
        if (entityMet) {
            entityMetadata.applyOption(entityMet);
        }

        if (defaultOrders) {
            entityMetadata.defaultOrders = defaultOrders.select((o) => {
                const selector = o[0];
                const direction = o[1];
                const itemArray: Array<IExpression<((...param: T[]) => ValueType) | OrderDirection>> = [];
                itemArray.push(selector instanceof FunctionExpression ? selector as FunctionExpression<ValueType, T> : ExpressionBuilder.parse<ValueType, T>(selector, [type]));
                itemArray.push(new ValueExpression(direction ? direction : "ASC"));
                return new ArrayValueExpression(...itemArray);
            }).toArray();
        }

        if (!allowInheritance) {
            entityMetadata.descriminatorMember = "";
        }

        const parentType = Object.getPrototypeOf(type) as IObjectType<TParent>;
        if (parentType !== ClassBase) {
            const parentMetaData: IEntityMetaData<TParent> = getEntityMetadata(parentType);
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
                    let columnMeta = entityMetadata.columns.first((p) => p.propertyName === parentColumnMeta.propertyName);
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
                                columnMeta = new ColumnMetaData<T, any>(parentColumnMeta.type, entityMetadata);
                                columnMeta.applyOption(parentColumnMeta);
                            }
                        }
                        else {
                            columnMeta = new InheritedColumnMetaData<T, any, any>(entityMetadata, parentColumnMeta);
                        }
                    }

                    if (columnMeta) {
                        entityMetadata.columns.push(columnMeta);
                        setColumnMetadata(type, parentColumnMeta.propertyName as StringKeyOf<T>, columnMeta as any);
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
        setEntityMetadata(type, entityMetadata);
    };
}

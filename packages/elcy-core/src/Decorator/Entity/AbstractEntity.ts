import { ClassBase } from "../../Common/Constant";
import { InheritanceType } from "../../Common/Enum";
import { OrderDirection } from "../../Common/StringType";
import { IObjectType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { getEntityMetadata, setColumnMetadata, setEntityMetadata } from "../../MetaData/MetaDataMapper";
import { InheritedColumnMetaData } from "../../MetaData/Relation/InheritedColumnMetaData";
import { InheritedComputedColumnMetaData } from "../../MetaData/Relation/InheritedComputedColumnMetaData";
import { IEntityOption } from "../Option/IEntityOption";
import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { LazyFunctionExpression } from "src/ExpressionBuilder/Expression/LazyFunctionExpression";
import { BooleanColumnMetaData, DateTimeColumnMetaData } from "src/MetaData";
import { IOrderDefinition } from "@elcy/enumerable";

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
            entityMetadata.defaultOrders = defaultOrders.map((o) => new ArrayValueExpression<OrderDirection | ((...param: T[]) => unknown)>(new LazyFunctionExpression(o[0], [type]), new ValueExpression(o[1])));
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
                    for (const propertyKey in parentMetaData.properties) {
                        const parentColumnMeta = parentMetaData.properties[propertyKey];
                        const existing = entityMetadata.properties[propertyKey];
                        let inheritedColumnMeta: IColumnMetaData<T>;
                        if (parentColumnMeta instanceof ComputedColumnMetaData) {
                            if (!existing) {
                                inheritedColumnMeta = new InheritedComputedColumnMetaData(entityMetadata, parentColumnMeta);
                            }
                        }
                        else {
                            inheritedColumnMeta = new InheritedColumnMetaData(entityMetadata, parentColumnMeta);
                        }

                        if (inheritedColumnMeta) {
                            entityMetadata.properties[propertyKey] = inheritedColumnMeta;
                            entityMetadata.columns[inheritedColumnMeta.columnName] = inheritedColumnMeta;
                            setColumnMetadata(type, parentColumnMeta.propertyName, inheritedColumnMeta as any);
                        }
                    }

                    if (entityMetadata.inheritance.inheritanceType !== InheritanceType.None) {
                        const additionProperties = Object.values<IColumnMetaData<T>>(entityMetadata.properties).filter((o) => !parentMetaData.properties[o.propertyName as unknown as keyof TParent]);
                        for (const columnMeta of additionProperties) {
                            // TODO
                            const parentColumnMeta = columnMeta as unknown as IColumnMetaData<TParent>;
                            parentMetaData.properties[parentColumnMeta.propertyName] = parentColumnMeta;
                            parentMetaData.columns[parentColumnMeta.columnName] = parentColumnMeta;
                        }
                    }

                    if (parentMetaData.primaryKeys.length > 0) {
                        entityMetadata.primaryKeys = parentMetaData.primaryKeys.map((o) => entityMetadata.properties[o.propertyName]);
                    }

                    if (parentMetaData.createDateColumn) {
                        entityMetadata.createDateColumn = entityMetadata.properties[parentMetaData.createDateColumn.propertyName] as DateTimeColumnMetaData<T>;
                    }
                    if (parentMetaData.modifiedDateColumn) {
                        entityMetadata.modifiedDateColumn = entityMetadata.properties[parentMetaData.modifiedDateColumn.propertyName] as DateTimeColumnMetaData<T>;
                    }
                    if (parentMetaData.deletedColumn) {
                        entityMetadata.deletedColumn = entityMetadata.properties[parentMetaData.deletedColumn.propertyName] as BooleanColumnMetaData<T>;
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

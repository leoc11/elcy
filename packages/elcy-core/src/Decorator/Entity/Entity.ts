import { ClassBase } from "../../Common/Constant";
import { InheritanceType } from "../../Common/Enum";
import type { IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import type { IOrderDefinition } from "@elcy/enumerable";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
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
import { ClassDecorator } from "../Type";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { proxyEntityType } from "src/Data/EntityChangeTracker";
import { LazyFunctionExpression } from "src/ExpressionBuilder/Expression/LazyFunctionExpression";

export function Entity<TC extends IObjectType<object>, TE extends TC extends IObjectType<infer U> ? U : never>(option: IEntityOption<TE>): ClassDecorator<TC>;
export function Entity<TC extends IObjectType<object>, TE extends TC extends IObjectType<infer U> ? U : never>(name?: string, defaultOrders?: Array<IOrderDefinition<TE>>, allowInheritance?: boolean): ClassDecorator<TC>;
export function Entity<TC extends IObjectType<object>, TE extends TC extends IObjectType<infer U> ? U : never>(optionOrName?: IEntityOption<TE> | string, defaultOrders?: Array<IOrderDefinition<TE>>, allowInheritance?: boolean): ClassDecorator<TC> {
    let option: IEntityOption<TE> = {};
    if (optionOrName) {
        if (typeof optionOrName === "string") {
            option.name = optionOrName;
            option.defaultOrders = defaultOrders || [];
            option.allowInheritance = allowInheritance;
            if (option.allowInheritance === undefined) {
                option.allowInheritance = true;
            }
        }
        else {
            option = optionOrName;
        }
    }

    return (type: TC, context: ClassDecoratorContext<TC>): TC => {
        if (!option.name) {
            option.name = type.name;
        }

        const proxyType = proxyEntityType(type) as TC & IObjectType<TE>;
        const entityMetadata = new EntityMetaData(proxyType, option.name);
        entityMetadata.schema = option.schema;

        const entityMet = getEntityMetadata(proxyType);
        if (entityMet) {
            entityMetadata.applyOption(entityMet);
        }

        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (Array.isArray(columnHandlers)) {
            for (const handler of columnHandlers) {
                handler(entityMetadata);
            }
        }

        if (option.defaultOrders) {
            entityMetadata.defaultOrders = option.defaultOrders.map((o) => {
                const selector = o[0];
                const direction = o[1];
                const itemArray: Array<IExpression<((...param: TE[]) => ValueType) | OrderDirection>> = [];
                itemArray.push(selector instanceof FunctionExpression ? selector as FunctionExpression<ValueType, [TE]> : new LazyFunctionExpression(selector, [proxyType]));
                itemArray.push(new ValueExpression(direction ? direction : "ASC"));
                return new ArrayValueExpression(...itemArray);
            });
        }

        if (!option.allowInheritance) {
            entityMetadata.descriminatorMember = "";
        }

        const parentType = Object.getPrototypeOf(type);
        if (parentType !== ClassBase) {
            const parentMetaData: IEntityMetaData = getEntityMetadata(parentType);
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
                    let columnMeta = entityMetadata.columns.find((p) => p.propertyName === parentColumnMeta.propertyName);
                    if (parentColumnMeta instanceof ComputedColumnMetaData) {
                        if (columnMeta) {
                            if (entityMetadata.inheritance.inheritanceType === InheritanceType.TablePerConcreteClass) {
                                columnMeta = new ComputedColumnMetaData<TE>();
                                columnMeta.applyOption(parentColumnMeta as any);
                            }
                            else {
                                columnMeta = new InheritedComputedColumnMetaData<TE, any>(entityMetadata, parentColumnMeta);
                            }
                        }
                    }
                    else {
                        if (entityMetadata.inheritance.inheritanceType === InheritanceType.TablePerConcreteClass) {
                            if (!columnMeta) {
                                const columnConstructor = parentColumnMeta.constructor as IObjectType<IColumnMetaData<TE>>;
                                columnMeta = new columnConstructor(parentColumnMeta.type as any, entityMetadata);
                                columnMeta.applyOption(parentColumnMeta);
                            }
                        }
                        else {
                            columnMeta = new InheritedColumnMetaData<TE, any, any>(entityMetadata, parentColumnMeta);
                        }
                    }

                    if (columnMeta) {
                        entityMetadata.columns.push(columnMeta);
                        setColumnMetadata(proxyType, parentColumnMeta.propertyName as StringKeyOf<TE>, columnMeta as any);
                    }
                }

                if (parentMetaData.primaryKeys.length > 0) {
                    entityMetadata.primaryKeys = parentMetaData.primaryKeys.map((o) => entityMetadata.columns.find((p) => p.propertyName === o.propertyName));
                }

                if (parentMetaData.createDateColumn) {
                    entityMetadata.createDateColumn = entityMetadata.columns.find((p) => p.propertyName === parentMetaData.createDateColumn.propertyName) as any;
                }
                if (parentMetaData.modifiedDateColumn) {
                    entityMetadata.modifiedDateColumn = entityMetadata.columns.find((p) => p.propertyName === parentMetaData.modifiedDateColumn.propertyName) as any;
                }
                if (parentMetaData.deletedColumn) {
                    entityMetadata.deletedColumn = entityMetadata.columns.find((p) => p.propertyName === parentMetaData.deletedColumn.propertyName) as any;
                }
                if (parentMetaData.defaultOrders && !entityMetadata.defaultOrders) {
                    entityMetadata.defaultOrders = parentMetaData.defaultOrders;
                }
            }
        }

        const handlers = context.metadata.behaviors as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (Array.isArray(handlers)) {
            for (const handler of handlers) {
                handler(entityMetadata);
            }
        }

        setEntityMetadata(proxyType, entityMetadata);

        return proxyType;
    };
}

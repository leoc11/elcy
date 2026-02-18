import { ClassBase } from "../../Common/Constant";
import { InheritanceType } from "../../Common/Enum";
import type { IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import type { IOrderDefinition } from "@elcy/enumerable";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
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
import { DateTimeColumnMetaData } from "src/MetaData/DateTimeColumnMetaData";
import { RowVersionColumnMetaData } from "src/MetaData/RowVersionColumnMetaData";
import { proxyEntityType } from "src/Data/EntityChangeTracker";

export function Entity<TE extends object>(option: IEntityOption<TE>): ClassDecorator<TE>;
export function Entity<TE extends object>(name?: string, defaultOrders?: Array<IOrderDefinition<TE>>, allowInheritance?: boolean): ClassDecorator<TE>;
export function Entity<TE extends object>(optionOrName?: IEntityOption<TE> | string, defaultOrders?: Array<IOrderDefinition<TE>>, allowInheritance?: boolean): ClassDecorator<TE> {
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

    return <TC extends IObjectType<TE>>(type: TC, context: ClassDecoratorContext<TC>): TC => {
        if (!option.name) {
            option.name = type.name;
        }

        const columns = context.metadata.columns as IColumnMetaData<TE, any>[];
        const proxyType = proxyEntityType(type, columns) as TC;
        const computedColumnMap = (context.metadata.computedColumnMap || new Map()) as Map<StringKeyOf<TE>, (o: TE) => any>;
        const primaryKeys = context.metadata.primaryKeys as Set<string | Symbol>;
        const entityMetadata = new EntityMetaData(proxyType, option.name);
        entityMetadata.schema = option.schema;
        entityMetadata.columns = columns;
        
        const entityMet = getEntityMetadata(proxyType);
        if (entityMet) {
            entityMetadata.applyOption(entityMet);
        }

        for (const column of columns) {
            if (computedColumnMap.has(column.propertyName)) {
                throw new Error(`Cannot re-declare column: ${column.propertyName}`);
            }
            setColumnMetadata(proxyType, column.propertyName, column);
            if (primaryKeys?.has(column.propertyName)) {
                entityMetadata.primaryKeys.push(column);
            }
            column.entity = entityMetadata;
        }

        for (const [propertyKey, fn] of computedColumnMap) {
            const fnExp = ExpressionBuilder.parse(fn, [type]);
            const column = new ComputedColumnMetaData(entityMetadata, fnExp, propertyKey);
            column.entity = entityMetadata;
            entityMetadata.columns.push(column);
            setColumnMetadata(proxyType, propertyKey, column);
        }

        if (context.metadata.createdDateColumn) {
            const column = entityMetadata.columns.find(o => o.propertyName == context.metadata.createdDateColumn);
            if (column instanceof DateTimeColumnMetaData) {
                entityMetadata.createDateColumn = column;
            }
        }

        if (context.metadata.modifiedDateColumn) {
            const column = entityMetadata.columns.find(o => o.propertyName == context.metadata.modifiedDateColumn);
            if (column instanceof DateTimeColumnMetaData) {
                entityMetadata.modifiedDateColumn = column;
            }
        }

        if (context.metadata.versionColumn) {
            const column = entityMetadata.columns.find(o => o.propertyName == context.metadata.versionColumn);
            if (column instanceof RowVersionColumnMetaData) {
                entityMetadata.versionColumn = column;

                if (!entityMetadata.concurrencyMode) {
                    entityMetadata.concurrencyMode = "OPTIMISTIC VERSION";
                }
            }
        }

        if (option.defaultOrders) {
            entityMetadata.defaultOrders = option.defaultOrders.select((o) => {
                const selector = o[0];
                const direction = o[1];
                const itemArray: Array<IExpression<((...param: TE[]) => ValueType) | OrderDirection>> = [];
                itemArray.push(selector instanceof FunctionExpression ? selector as FunctionExpression<ValueType, TE> : ExpressionBuilder.parse<ValueType, TE>(selector, [type]));
                itemArray.push(new ValueExpression(direction ? direction : "ASC"));
                return new ArrayValueExpression(...itemArray);
            }).toArray();
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
                    let columnMeta = entityMetadata.columns.first((p) => p.propertyName === parentColumnMeta.propertyName);
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
        setEntityMetadata(proxyType, entityMetadata);

        return proxyType;
    };
}

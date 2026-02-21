import "reflect-metadata";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { entityMetaKey, relationMetaKey } from "../DecoratorKey";
import { IRelationData, IRelationOption } from "../Option/IRelationOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { Enumerable } from "@elcy/enumerable";
import { FunctionHelper } from "src/Helper/FunctionHelper";
import { IObjectType } from "src/Common/Type";

export function Relationship<TE extends object>(name: string): ClassPropertyDecorator<TE>;
export function Relationship<TE extends object, T extends object>(type: IObjectType<T>, option: IRelationOption<TE, T>): ClassPropertyDecorator<TE, T | undefined>;
export function Relationship<TE extends object, T extends object>(nameOrType: string | IObjectType<T>, option?: IRelationOption<TE, T>): ClassPropertyDecorator<TE, T | undefined> {
    if (typeof nameOrType === "string") {
        const name = nameOrType;
        return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T | undefined> | ClassAccessorDecoratorContext<TE, T | undefined>) => {
            let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
            if (!Array.isArray(handlers)) {
                context.metadata.relations = handlers = [];
            }

            handlers.push((entityMeta) => {
                const parentData: IRelationData<TE, T> = {
                    isMaster: true,
                    metaData: entityMeta,
                    propertyName: context.name as keyof TE,
                    name: name
                };
                const parentRelationMeta = new RelationMetaData(parentData);
                Reflect.defineMetadata(relationMetaKey, parentRelationMeta, parentData.metaData.type, parentData.propertyName);
                entityMeta.relations.push(parentRelationMeta);
            });
        }
    }
    else {
        const targetType = nameOrType;
        if (!option.relationKeyName) {
            option.relationKeyName = `fk_${option.name}`;
        }

        return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T | undefined> | ClassAccessorDecoratorContext<TE, T | undefined>) => {
            let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
            if (!Array.isArray(handlers)) {
                context.metadata.relations = handlers = [];
            }

            handlers.push((entityMeta) => {
                const targetMetaData: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, targetType);
                const relationMap = Enumerable.from(option.relationMap).map(([chilProp, parentProp]) => {
                    const childPropName = typeof chilProp === "string" ? chilProp : FunctionHelper.propertyName(chilProp);
                    const childColumn = entityMeta.columns.find(o => o.propertyName === childPropName);
                    const parentPropName = typeof parentProp === "string" ? parentProp : FunctionHelper.propertyName(parentProp);
                    const parentColumn = entityMeta.columns.find(o => o.propertyName === parentPropName);

                    return [childColumn, parentColumn];
                }).toMap(o => o[0], o => o[1]);
                const childData: IRelationData<TE, T> = {
                    isMaster: false,
                    metaData: entityMeta,
                    targetMetaData: targetMetaData,
                    propertyName: context.name as keyof TE,
                    name: option.name,
                    relationKeyName: option.relationKeyName,
                    relationMap: relationMap,
                };
                const childRelationMeta = new RelationMetaData(childData);
                Reflect.defineMetadata(relationMetaKey, childRelationMeta, childData.metaData.type, childData.propertyName);
                entityMeta.relations.push(childRelationMeta);

                const parentRelationMeta = targetMetaData.relations.find(o => o.name === option.name && o.isMaster && !o.target);
                parentRelationMeta.completeRelation(childRelationMeta);
            });
        }
    }
}



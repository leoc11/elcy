import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IRelationData, IRelationOption } from "../Option/IRelationOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { Enumerable } from "@elcy/enumerable";
import { FunctionHelper } from "src/Helper/FunctionHelper";
import { IObjectType, PropertySelector } from "src/Common/Type";
import { getEntityMetadata, setRelationMetadata } from "src/MetaData/MetaDataMapper";

export function Relationship<TE extends object>(entity: string, name?: string): ClassPropertyDecorator<TE>;
export function Relationship<TE extends object, T extends object>(type: IObjectType<T>, option: IRelationOption<TE, T> | Map<PropertySelector<TE>, PropertySelector<T>>): ClassPropertyDecorator<TE, T | undefined>;
export function Relationship<TE extends object, T extends object>(entityOrType: string | IObjectType<T>, nameOrOption?: string | IRelationOption<TE, T> | Map<PropertySelector<TE>, PropertySelector<T>>): ClassPropertyDecorator<TE, T | undefined> {
    if (typeof entityOrType === "string") {
        const entity = entityOrType;
        return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T | undefined> | ClassAccessorDecoratorContext<TE, T | undefined>) => {
            let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
            if (!Array.isArray(handlers)) {
                context.metadata.relations = handlers = [];
            }

            handlers.push((entityMeta) => {
                const name = nameOrOption as string ?? entityMeta.type.name;
                const parentData: IRelationData<TE, T> = {
                    isMaster: true,
                    metaData: entityMeta,
                    propertyName: context.name as keyof TE,
                    name: `${entity?.toLocaleLowerCase()}_${name?.toLocaleLowerCase()}`
                };
                const parentRelationMeta = new RelationMetaData(parentData);
                setRelationMetadata(parentData.metaData.type, parentData.propertyName, parentRelationMeta);
                entityMeta.relations.push(parentRelationMeta);
            });
        }
    }
    else {
        const targetType = entityOrType;
        let option: IRelationOption<TE, T>;
        if (nameOrOption instanceof Map) {
            option = {
                relationMap: nameOrOption
            };
        }
        else {
            option = nameOrOption as IRelationOption<TE, T>;
        }
        if (!option.name) {
            option.name = targetType.name;
        }
        if (!option.relationKeyName) {
            option.relationKeyName = `fk_${option.name}`;
        }

        return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T | undefined> | ClassAccessorDecoratorContext<TE, T | undefined>) => {
            let handlers = context.metadata.relations as Array<(entityMeta: IEntityMetaData<TE>) => void>;
            if (!Array.isArray(handlers)) {
                context.metadata.relations = handlers = [];
            }

            handlers.push((entityMeta) => {
                const targetMetaData = getEntityMetadata(targetType);
                const relationMap = Enumerable.from(option.relationMap).map(([chilProp, parentProp]) => {
                    const childPropName = typeof chilProp === "string" ? chilProp : FunctionHelper.propertyName(chilProp);
                    const childColumn = entityMeta.columns.find(o => o.propertyName === childPropName);
                    const parentPropName = typeof parentProp === "string" ? parentProp : FunctionHelper.propertyName(parentProp);
                    const parentColumn = targetMetaData.columns.find(o => o.propertyName === parentPropName);

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
                setRelationMetadata(childData.metaData.type, childData.propertyName, childRelationMeta);
                entityMeta.relations.push(childRelationMeta);

                let parentRelationMeta = targetMetaData.relations.find(o => o.name === `${entityMeta?.type?.name?.toLocaleLowerCase()}_${option.name?.toLocaleLowerCase()}` && o.isMaster && !o.target);
                if (!parentRelationMeta) {
                    parentRelationMeta = new RelationMetaData({
                        isMaster: true,
                        metaData: targetMetaData,
                        propertyName: undefined,
                        name: option.name
                    }) as any;
                }
                parentRelationMeta.completeRelation(childRelationMeta);
            });
        }
    }
}



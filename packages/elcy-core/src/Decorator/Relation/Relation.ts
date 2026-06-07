import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IRelationData, IRelationOption } from "../Option/IRelationOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { Enumerable } from "@elcy/enumerable";
import { FunctionHelper } from "src/Helper/FunctionHelper";
import { IObjectType, PropertySelectorType, RelationSelector, StringKeyOf, ValueType } from "src/Common/Type";
import { getEntityMetadata, setRelationMetadata } from "src/MetaData/MetaDataMapper";
import { IRelationMetaData } from "src/MetaData";
import { registerRelationFinalizer } from "./RelationFinalizer";

export function Relation<TE extends object, TT extends object, T extends ValueType>(type: () => IObjectType<TT>, sourceSelector: PropertySelectorType<TE, T>, targetSelector: PropertySelectorType<TT, T>): ClassPropertyDecorator<TE, TT | undefined>;
export function Relation<TE extends object, T extends object>(type: () => IObjectType<T>, map: RelationSelector<TE, T>[]): ClassPropertyDecorator<TE, T | undefined>;
export function Relation<TE extends object, T extends object>(type: () => IObjectType<T>, option: IRelationOption<TE, T>): ClassPropertyDecorator<TE, T | undefined>;
export function Relation<TE extends object, T extends object>(type: () => IObjectType<T>, mapOrOption?: RelationSelector<TE, T>[] | IRelationOption<TE, T> | PropertySelectorType<TE>, targetSelector?: PropertySelectorType<T>): ClassPropertyDecorator<TE, T | undefined> {
    let option: IRelationOption<TE, T>;
    if (Array.isArray(mapOrOption)) {
        option = {
            relationMap: mapOrOption
        };
    }
    else if (typeof mapOrOption === "object") {
        option = mapOrOption;
    }
    else{
        const relationMap = [[mapOrOption, targetSelector]] as RelationSelector<TE, T>[];
        option = {
            relationMap: relationMap
        };
    }

    return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T | undefined> | ClassAccessorDecoratorContext<TE, T | undefined>) => {
        let handlers = context.metadata.behaviors as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.behaviors = handlers = [];
        }

        handlers.push((entityMeta) => {
            registerRelationFinalizer("child", () => {
                const targetType = type();
                if (!option.name) {
                    option.name = targetType.name;
                }
                if (!option.relationKeyName) {
                    option.relationKeyName = `fk_${option.name}`;
                }

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
                    propertyName: context.name as StringKeyOf<TE>,
                    name: option.name,
                    relationKeyName: option.relationKeyName,
                    relationMap: relationMap as any,
                };
                const childRelationMeta = new RelationMetaData(childData);
                setRelationMetadata(childData.metaData.type, childData.propertyName, childRelationMeta as any);
                entityMeta.relations.push(childRelationMeta);

                const parentRelationMeta = new RelationMetaData({
                    isMaster: true,
                    metaData: targetMetaData,
                    propertyName: undefined,
                    name: option.name
                }) as IRelationMetaData<T>;
                parentRelationMeta.completeRelation(childRelationMeta);
            });
        });
    }
}

import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";
import { IRelationData } from "../Option/IRelationOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { IEnumerable } from "@elcy/enumerable";
import { FunctionHelper } from "src/Helper/FunctionHelper";
import { IObjectType, PropertySelectorType, StringKeyOf, StringKeyOfValue } from "src/Common/Type";
import { getEntityMetadata, setRelationMetadata } from "src/MetaData/MetaDataMapper";
import { registerRelationFinalizer, scheduleRelationFinalizer } from "./RelationFinalizer";

export function ReverseRelation<TE extends object, T extends object>(type: () => IObjectType<T>, relation: StringKeyOfValue<T, TE>): ClassPropertyDecorator<TE, T | IEnumerable<T> | undefined>;
export function ReverseRelation<TE extends object, T extends object>(type: () => IObjectType<T>, relation: (source: T) => TE | undefined): ClassPropertyDecorator<TE, T | IEnumerable<T> | undefined>;
export function ReverseRelation<TE extends object, T extends object>(type: () => IObjectType<T>, relation: PropertySelectorType<T, TE>): ClassPropertyDecorator<TE, T | IEnumerable<T> | undefined> {
    return (_: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T | IEnumerable<T> | undefined> | ClassAccessorDecoratorContext<TE, T | IEnumerable<T> | undefined>) => {
        let handlers = context.metadata.behaviors as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.behaviors = handlers = [];
        }

        handlers.push((entityMeta) => {
            registerRelationFinalizer("master", () => {
                const targetType = type();
                const reverseRelation = typeof relation === "string" ? relation : FunctionHelper.propertyName(relation);
                const parentData: IRelationData<TE, T> = {
                    isMaster: true,
                    metaData: entityMeta,
                    propertyName: context.name as StringKeyOf<TE>,
                    name: `${targetType.name.toLocaleLowerCase()}_${reverseRelation}`
                };
                const parentRelationMeta = new RelationMetaData(parentData);
                setRelationMetadata(parentData.metaData.type, parentData.propertyName, parentRelationMeta);
                entityMeta.relations.push(parentRelationMeta);

                const targetMetaData = getEntityMetadata(targetType);
                let childRelationMeta = targetMetaData.relations.find(o => o.propertyName === reverseRelation && !o.isMaster);
                parentRelationMeta.completeRelation(childRelationMeta);
            });
            scheduleRelationFinalizer();
        });
    }
}

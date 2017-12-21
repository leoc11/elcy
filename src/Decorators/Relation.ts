import "reflect-metadata";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { RelationMetaData } from "../MetaData/RelationMetaData";
import { genericType, RelationType } from "../MetaData/Types";
import { entityMetaKey } from "./DecoratorKey";

// for multiple ForeignKey mapping use multiple ForeignKeyDecorator
export function Relation<S, T, K>(childEntityType: genericType<T>, sourceKeySelector: (source: S) => K, targetKeySelector: (source: T) => K, name?: string): (target: S, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const sourceProperty = sourceKeySelector.toString();
    const targetProperty = targetKeySelector.toString();
    return (target: S, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        if (!name)
            name = "FK_" + propertyKey + "_" + target.constructor.name + "_" + childEntityType.name;

        const sourceMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target);
        const targetMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, childEntityType);
        const isSourcePrimaryKey = sourceMetaData.primaryKeys.indexOf(sourceProperty) >= 0;
        const isTargetPrimaryKey = targetMetaData.primaryKeys.indexOf(targetProperty) >= 0;
        const isTargetPropertyValid = isTargetPrimaryKey || Object.keys(targetMetaData.uniques).any((key) => targetMetaData.uniques[key].members.contains(targetProperty));
        if (!isTargetPropertyValid)
            throw new Error("Target property not valid. Target property must be a unique column");

        let relationMetaData = sourceMetaData.relationShips[name];
        if (relationMetaData == null) {
            let relationType = RelationType.OneToMany;
            if (isSourcePrimaryKey && isTargetPrimaryKey)
                relationType = RelationType.OneToOne;
            relationMetaData = new RelationMetaData(target.constructor as genericType<S>, childEntityType, name, [], relationType, true);
        }

        if (!relationMetaData.relationMaps.any((relationMap) => relationMap.source === sourceProperty && relationMap.target === targetProperty)) {
            relationMetaData.relationMaps.push({ source: sourceProperty, target: targetProperty });
        }

        relationMetaData = targetMetaData.relationShips[name];
        if (relationMetaData == null) {
            relationMetaData = new RelationMetaData(childEntityType, target.constructor as genericType<S>, name, []);
        }

        if (!relationMetaData.relationMaps.any((relationMap) => relationMap.source === targetProperty && relationMap.target === sourceProperty)) {
            relationMetaData.relationMaps.push({ source: targetProperty, target: sourceProperty });
        }
    };
}

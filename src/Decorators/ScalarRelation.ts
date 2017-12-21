import "reflect-metadata";
import { ColumnMetaData } from "../MetaData/ColumnMetaData";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { RelationMetaData } from "../MetaData/RelationMetaData";
import { genericType, ReferenceOption, RelationType } from "../MetaData/Types";
import { columnMetaKey, entityMetaKey } from "./DecoratorKey";

// for multiple ForeignKey mapping use multiple ForeignKeyDecorator
export function ScalarRelation<S, T>(option: IRelationMetaData<S, T, keyof S, keyof T>)
    : (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function ScalarRelation<S, T>(masterType: genericType<T>, sourceKeySelectors: Array<(source: S) => any>, targetKeySelectors: Array<(source: T) => any>, backRelation?: (target: T) => S, updateCascade?: ReferenceOption, deleteCascade?: ReferenceOption)
    : (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function ScalarRelation<S, T>(masterType: genericType<T> | IRelationMetaData<S, T, keyof S, keyof T>, sourceKeySelectors?: Array<(source: S) => any>, targetKeySelectors?: Array<(source: T) => any>, backRelation?: (target: T) => S, updateCascade?: ReferenceOption, deleteCascade?: ReferenceOption)
    : (target: S, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    if (typeof masterType === "object") {
        return (target: S, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
            const sourceMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
            let relationMetaData = sourceMetaData.relationShips[propertyKey];
            if (relationMetaData == null) {
                relationMetaData = new RelationMetaData(masterType);
                sourceMetaData.relationShips[propertyKey] = relationMetaData;
            }
        };
    }
    else {
        if (!sourceKeySelectors) throw new Error("sourceKeySelectors not defined");
        if (!targetKeySelectors) throw new Error("targetKeySelectors not defined");
        if (sourceKeySelectors.length !== targetKeySelectors.length || sourceKeySelectors.length <= 0)
            throw new Error("invalid key selector");
        const sourceProperties = sourceKeySelectors.select((o) => o.toString()); // TODO : need extract property name here
        const targetProperties = targetKeySelectors.select((o) => o.toString());
        let backRelationName = "";
        if (backRelation)
            backRelationName = backRelation.toString();

        return (target: S, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
            const sourceFkName = "FK_" + propertyKey + "_" + target.constructor.name + "_" + masterType.name;

            const sourceMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
            const targetMetaData: EntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, masterType);
            const targetUniqueKeys = Object.keys(targetMetaData.uniques);
            if (sourceProperties.any((o) => !targetMetaData.primaryKeys.contains(o) && (targetUniqueKeys.length < 0 || targetUniqueKeys.all((key) => !targetMetaData.uniques[key].members.contains(o)))))
                throw new Error("Target property not valid. Target property must be a unique column");

            const relationMaps: Array<{
                source: string;
                target: string;
            }> = [];

            for (let i = 0; i < sourceProperties.length; i++) {
                const sourceProperty = sourceProperties[i];
                const targetProperty = targetProperties[i];
                const sourceColumnMetaData: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, target, sourceProperties[i]);
                const targetColumnMetaData: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, masterType, targetProperties[i]);
                if (sourceColumnMetaData.columnType !== targetColumnMetaData.columnType) {
                    throw new Error("Invalid property map. `${sourceProperty}` and `{targetProperty}` type not match");
                }
                relationMaps.push({ source: sourceProperty, target: targetProperty });
            }

            let relationMetaData = sourceMetaData.relationShips[propertyKey];
            if (relationMetaData == null) {
                relationMetaData = new RelationMetaData(target.constructor as genericType<S>, masterType, [], RelationType.OneToOne, sourceFkName, updateCascade, deleteCascade);
                sourceMetaData.relationShips[propertyKey] = relationMetaData;
            }

            relationMetaData.relationMaps = relationMaps;

            if (backRelationName) {
                relationMetaData = targetMetaData.relationShips[backRelationName];
                if (relationMetaData == null) {
                    relationMetaData = new RelationMetaData(masterType, target.constructor as genericType<S>, [], RelationType.OneToOne);
                    targetMetaData.relationShips[propertyKey] = relationMetaData;
                }

                relationMetaData.relationMaps = relationMaps.select((o) => ({ source: o.target, target: o.source }));
            }
        };
    }
}

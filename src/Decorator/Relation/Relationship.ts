import "reflect-metadata";
import { IObjectType, RelationshipType } from "../../Common/Type";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { entityMetaKey, relationMetaKey } from "../DecoratorKey";
import { IRelationOption } from "../Option";
import { RelationMetaData } from "../../MetaData/Relation/RelationMetaData";

export function Relationship<S, T = any>(name: string, type: RelationshipType, targetType: IObjectType<T> | string, relationKeys?: Array<keyof S | ((source: S) => any)>): PropertyDecorator;
export function Relationship<S, T = any>(name: string, type: RelationshipType, targetType: IObjectType<T> | string, relationKeys?: Array<keyof S | ((source: S) => any)>): PropertyDecorator;
export function Relationship<S, T = any>(name: string, direction: "by", type: RelationshipType, targetType: IObjectType<T> | string, relationKeys?: Array<keyof S | ((source: S) => any)>): PropertyDecorator;
export function Relationship<S, T = any>(name: string, typeOrDirection: RelationshipType | "by", targetTypeOrType: IObjectType<T> | string | RelationshipType, relationKeysOrTargetType: Array<keyof S | ((source: S) => any)> | IObjectType<T> | string, relationKey?: Array<keyof S | ((source: S) => any)>): PropertyDecorator {
    let relationOption: IRelationOption<S, T> = {
        name
    } as any;
    let targetName: string;
    if (typeOrDirection === "by") {
        // slave relation.
        relationOption.isMaster = false;
        relationOption.relationType = targetTypeOrType as any;
        if (typeof relationKeysOrTargetType === "string") {
            targetName = relationKeysOrTargetType;
        }
        else {
            relationOption.targetType = relationKeysOrTargetType as any;
            targetName = relationOption.targetType.name;
        }
        relationOption.relationKeys = relationKey as any;
    }
    else {
        // master relation.
        relationOption.isMaster = true;
        relationOption.relationType = typeOrDirection as any;
        if (typeof targetTypeOrType === "string") {
            targetName = targetTypeOrType;
        }
        else {
            relationOption.targetType = targetTypeOrType as any;
            targetName = relationOption.targetType.name;
        }
        relationOption.relationKeys = relationKeysOrTargetType as any;
    }
    // TODO: FOR SQL TO-ONE relation target must be a unique or primarykeys
    // TODO: Foreignkey for SQL DB

    return (target: S, propertyKey: string | symbol) => {
        if (!relationOption.sourceType)
            relationOption.sourceType = target.constructor as any;
        relationOption.propertyName = propertyKey as any;
        const sourceMetaData: EntityMetaData<S> = Reflect.getOwnMetadata(entityMetaKey, relationOption.sourceType!);

        const relationMeta = new RelationMetaData(relationOption);
        Reflect.defineMetadata(relationMetaKey, relationMeta, relationOption.sourceType!, propertyKey);
        
        const relationName = relationMeta.name + "_" + (relationOption.isMaster ? relationMeta.source.type.name + "_" + targetName : targetName + "_" + relationMeta.source.type.name);
        relationMeta.name = relationName;
        sourceMetaData.relations.push(relationMeta);

        if (relationOption.targetType) {
            const targetMetaData: EntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, relationOption.targetType);
            const reverseRelation = targetMetaData.relations.first(o => o.name === relationName);

            if (reverseRelation) {
                relationMeta.completeRelation(reverseRelation);
            }
        }
    };
}

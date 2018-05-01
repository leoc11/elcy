import "reflect-metadata";
import { IObjectType } from "../../Common/Type";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { entityMetaKey } from "../DecoratorKey";
import { IRelationDataOption } from "../Option/IRelationDataOption";
import { FunctionHelper } from "../../Helper/FunctionHelper";
import { RelationDataMetaData } from "../../MetaData/Relation/RelationDataMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
export function RelationshipData<M, S = any, T = any>(options: IRelationDataOption<M, S, T>): ClassDecorator;
export function RelationshipData<M, S = any, T = any>(sourceType: IObjectType<S> | string, relationName: string, targetType: IObjectType<T> | string, name: string, sourceRelationKeys?: Array<keyof M | ((source: M) => any)>, targetRelationKeys?: Array<keyof M | ((source: M) => any)>): ClassDecorator;
export function RelationshipData<M, S = any, T = any>(optionsOrSourceType: IRelationDataOption<M, S, T> | IObjectType<S> | string, relationName?: string, targetType?: IObjectType<T> | string, name?: string, sourceRelationKeys?: Array<keyof M | ((source: M) => any)>, targetRelationKeys?: Array<keyof M | ((source: M) => any)>): ClassDecorator {
    let relationOption: IRelationDataOption<M, S, T>;
    let sourceName: string, targetName: string;
    if (typeof optionsOrSourceType === "object") {
        relationOption = optionsOrSourceType;
        sourceName = relationOption.sourceType.name;
        targetName = relationOption.targetType.name;
    }
    else {
        relationOption = {
            relationName: relationName,
            name: name,
            sourceRelationKeys: sourceRelationKeys.select(o => o instanceof Function ? FunctionHelper.propertyName(o) : o).toArray(),
            targetRelationKeys: targetRelationKeys.select(o => o instanceof Function ? FunctionHelper.propertyName(o) : o).toArray()
        };
        if (typeof optionsOrSourceType !== "string") {
            relationOption.sourceType = optionsOrSourceType;
            sourceName = optionsOrSourceType.name;
        }
        else {
            sourceName = optionsOrSourceType;
        }
        if (typeof targetType !== "string") {
            relationOption.targetType = targetType;
            targetName = targetType.name;
        }
        else {
            targetName = targetType;
        }
    }
    return (target: IObjectType<M>) => {
        relationOption.type = target;
        if (!relationOption.name)
            relationOption.name = target.name;

        const relationDataMeta = new RelationDataMetaData<M, S, T>(relationOption);
        const entityMet: IEntityMetaData<T, any> = Reflect.getOwnMetadata(entityMetaKey, relationOption.type);
        if (entityMet)
            relationDataMeta.ApplyOption(entityMet);

        const sourceMetaData: EntityMetaData<S> = Reflect.getOwnMetadata(entityMetaKey, relationOption.sourceType);
        const sourceRelationMeta = sourceMetaData.relations[relationDataMeta.relationName + "_" + targetName];

        const targetMetaData: EntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, relationOption.targetType);
        const targetRelationMeta = targetMetaData.relations[relationDataMeta.relationName + "_" + sourceName];

        relationDataMeta.completeRelation(sourceRelationMeta, targetRelationMeta);
        Reflect.defineMetadata(entityMetaKey, relationDataMeta, target);
    };
}

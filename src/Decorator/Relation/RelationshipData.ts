import { IObjectType, PropertySelector } from "../../Common/Type";
import { FunctionHelper } from "../../Helper/FunctionHelper";
import { EntityMetaData } from "../../MetaData/EntityMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { RelationDataMetaData } from "../../MetaData/Relation/RelationDataMetaData";
import { IRelationDataOption } from "../Option/IRelationDataOption";
import { IAdditionalRelationOption } from "../Option/IRelationOption";
import { getEntityMetadata, setEntityMetadata } from "src/MetaData/MetaDataMapper";
export function RelationshipData<M extends object, S = any, T = any>(options: IRelationDataOption<M, S, T>): ClassDecorator;
export function RelationshipData<M extends object, S = any, T = any>(sourceType: IObjectType<S> | string, relationName: string, targetType: IObjectType<T> | string, sourceRelationKeys?: Array<PropertySelector<M>>, targetRelationKeys?: Array<PropertySelector<M>>, name?: string, options?: IAdditionalRelationOption): ClassDecorator;
export function RelationshipData<M extends object, S = any, T = any>(optionsOrSourceType: IRelationDataOption<M, S, T> | IObjectType<S> | string, relationName?: string, targetType?: IObjectType<T> | string, sourceRelationKeys?: Array<PropertySelector<M>>, targetRelationKeys?: Array<PropertySelector<M>>, name?: string, options?: IAdditionalRelationOption): ClassDecorator {
    let relationOption: IRelationDataOption<M, S, T>;
    let sourceName: string;
    let targetName: string;
    if (typeof optionsOrSourceType === "object") {
        relationOption = optionsOrSourceType;
        sourceName = relationOption.sourceType.name;
        targetName = relationOption.targetType.name;
    }
    else {
        relationOption = {
            relationName: relationName,
            name,
            sourceRelationKeys: sourceRelationKeys.map((o) => o instanceof Function ? FunctionHelper.propertyName(o) : o),
            targetRelationKeys: targetRelationKeys.map((o) => o instanceof Function ? FunctionHelper.propertyName(o) : o)
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

        if (options) {
            Object.assign(relationOption, options);
        }
    }
    return (target: IObjectType<M>) => {
        relationOption.type = target;
        if (!relationOption.name) {
            relationOption.name = target.name;
        }

        relationOption.relationName += "_" + sourceName + "_" + targetName;

        const relationDataMeta = new RelationDataMetaData<M, S, T>(relationOption);
        const entityMet: IEntityMetaData<M, any> = getEntityMetadata(relationOption.type);
        if (entityMet) {
            relationDataMeta.ApplyOption(entityMet);
        }

        const sourceMetaData: EntityMetaData<S> = getEntityMetadata(relationOption.sourceType);
        const sourceRelationMeta = sourceMetaData.relations.find((o) => o.fullName === relationDataMeta.relationName);

        const targetMetaData: EntityMetaData<T> = getEntityMetadata(relationOption.targetType);
        const targetRelationMeta = targetMetaData.relations.find((o) => o.fullName === relationDataMeta.relationName);

        relationDataMeta.completeRelation(sourceRelationMeta, targetRelationMeta);
        setEntityMetadata(target, relationDataMeta);
    };
}

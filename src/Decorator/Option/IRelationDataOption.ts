import { IObjectType, StringKeyOf } from "../../Common/Type";
import { IAdditionalRelationOption } from "./IRelationOption";

export interface IRelationDataOption<TType, TSource, TTarget> extends IAdditionalRelationOption {
    name?: string;
    relationName?: string;
    sourceRelationKeys?: StringKeyOf<TType>[];
    sourceType?: IObjectType<TSource>;
    targetRelationKeys?: StringKeyOf<TType>[];
    targetType?: IObjectType<TTarget>;
    type?: IObjectType<TType>;
}

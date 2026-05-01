import { IObjectType } from "../../Common/Type";
import { IAdditionalRelationOption } from "./IRelationOption";

export interface IRelationDataOption<TType, TSource, TTarget> extends IAdditionalRelationOption {
    name?: string;
    relationName?: string;
    sourceRelationKeys?: string[];
    sourceType?: IObjectType<TSource>;
    targetRelationKeys?: string[];
    targetType?: IObjectType<TTarget>;
    type?: IObjectType<TType>;
}

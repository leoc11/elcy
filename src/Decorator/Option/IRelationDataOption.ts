import { IObjectType } from "../../Common/Type";
import { IAdditionalRelationOption } from "./IRelationOption";

export interface IRelationDataOption<TType, TSource, TTarget> extends IAdditionalRelationOption {
    type?: IObjectType<TType>;
    sourceType?: IObjectType<TSource>;
    targetType?: IObjectType<TTarget>;
    sourceRelationKeys?: string[];
    targetRelationKeys?: string[];
    name?: string;
    relationName?: string;
}

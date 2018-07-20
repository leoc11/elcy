import { IObjectType } from "../../Common/Type";

export interface IRelationDataOption<TType, TSource, TTarget> {
    type?: IObjectType<TType>;
    sourceType?: IObjectType<TSource>;
    targetType?: IObjectType<TTarget>;
    sourceRelationKeys?: string[];
    targetRelationKeys?: string[];
    name?: string;
    relationName?: string;
}

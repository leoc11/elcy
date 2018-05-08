import { IObjectType } from "../../Common/Type";
import { IEntityMetaData } from ".";
import { IColumnMetaData } from "./IColumnMetaData";

export interface IRelationDataMetaData<TType, TSource, TTarget> {
    type?: IObjectType<TType>;
    source?: IEntityMetaData<TSource>;
    target?: IEntityMetaData<TTarget>;
    sourceRelationColumns?: IColumnMetaData<TSource>[];
    targetRelationColumns?: IColumnMetaData<TTarget>[];
    name?: string;
    relationName?: string;
}

import { IObjectType } from "../../Common/Type";
import { IEntityMetaData } from ".";
import { IColumnMetaData } from "./IColumnMetaData";

export interface IRelationDataMetaData<TType, TSource, TTarget> extends IEntityMetaData<TType> {
    name: string;
    type: IObjectType<TType>;
    source?: IEntityMetaData<TSource>;
    target?: IEntityMetaData<TTarget>;
    sourceRelationColumns?: IColumnMetaData<TType>[];
    targetRelationColumns?: IColumnMetaData<TType>[];
    relationName?: string;
}

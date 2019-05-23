import { IObjectType, ReferenceOption } from "../../Common/Type";
import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IRelationDataMetaData<TType, TSource, TTarget> extends IEntityMetaData<TType> {
    name: string;
    type: IObjectType<TType>;
    source?: IEntityMetaData<TSource>;
    target?: IEntityMetaData<TTarget>;
    sourceRelationColumns?: Array<IColumnMetaData<TType>>;
    targetRelationColumns?: Array<IColumnMetaData<TType>>;
    sourceRelationMaps?: Map<IColumnMetaData<TType>, IColumnMetaData<TSource>>;
    targetRelationMaps?: Map<IColumnMetaData<TType>, IColumnMetaData<TTarget>>;
    relationName?: string;
    deleteOption?: ReferenceOption;
    updateOption?: ReferenceOption;
}

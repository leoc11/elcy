import { ReferenceOption } from "../../Common/StringType";
import { IObjectType } from "../../Common/Type";
import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IRelationDataMetaData<TType, TSource, TTarget> extends IEntityMetaData<TType> {
    deleteOption?: ReferenceOption;
    name: string;
    relationName?: string;
    source?: IEntityMetaData<TSource>;
    sourceRelationColumns?: Array<IColumnMetaData<TType>>;
    sourceRelationMaps?: Map<IColumnMetaData<TType>, IColumnMetaData<TSource>>;
    target?: IEntityMetaData<TTarget>;
    targetRelationColumns?: Array<IColumnMetaData<TType>>;
    targetRelationMaps?: Map<IColumnMetaData<TType>, IColumnMetaData<TTarget>>;
    type: IObjectType<TType>;
    updateOption?: ReferenceOption;
}

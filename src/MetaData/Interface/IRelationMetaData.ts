import { RelationshipType, ReferenceOption } from "../../Common/Type";
import { IEntityMetaData } from ".";
import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationDataMetaData } from "./IRelationDataMetaData";

export interface IRelationMetaData<TSource = any, TTarget = any> {
    name: string;
    propertyName?: keyof TSource;
    relationType: RelationshipType;
    relationColumns: Array<IColumnMetaData<TSource>>;
    isMaster: boolean;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    reverseRelation?: IRelationMetaData<TTarget, TSource>;
    relationMaps?: Map<IColumnMetaData<TSource>, IColumnMetaData>;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
    nullable?: boolean;
    completeRelation?(reverseRelation: IRelationMetaData<TTarget, TSource>): void;
    relationData?: IRelationDataMetaData<any, TSource, TTarget>;
    completeRelationType?: string;
}

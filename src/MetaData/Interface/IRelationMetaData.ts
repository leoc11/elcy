import { CompleteRelationshipType, ReferenceOption, RelationshipType } from "../../Common/Type";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IBaseRelationMetaData } from "./IBaseRelationMetaData";
import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";
import { IRelationDataMetaData } from "./IRelationDataMetaData";

export interface IRelationMetaData<TSource = any, TTarget = any> extends IBaseRelationMetaData<TSource, TTarget> {
    name?: string;
    fullName: string;
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
    relationData?: IRelationDataMetaData<any, TSource, TTarget> | IRelationDataMetaData<any, TTarget, TSource>;
    completeRelationType?: CompleteRelationshipType;

    // Helper property to improve hydration performance issue
    /**
     * Column used in relation that has been mapped to an entity's property.
     */
    mappedRelationColumns?:  Enumerable<IColumnMetaData<TSource>>;
    completeRelation?(reverseRelation: IRelationMetaData<TTarget, TSource>): void;
}

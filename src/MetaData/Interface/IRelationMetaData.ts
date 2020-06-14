import { CompleteRelationshipType, ReferenceOption, RelationshipType } from "../../Common/StringType";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IBaseRelationMetaData } from "./IBaseRelationMetaData";
import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";
import { IRelationDataMetaData } from "./IRelationDataMetaData";

export interface IRelationMetaData<TSource = any, TTarget = any>  extends IBaseRelationMetaData<TSource, TTarget> {
    completeRelationType?: CompleteRelationshipType;
    deleteOption?: ReferenceOption;
    fullName: string;
    isMaster: boolean;

    // Helper property to improve hydration performance issue
    /**
     * Column used in relation that has been mapped to an entity's property.
     */
    mappedRelationColumns?:  Enumerable<IColumnMetaData<TSource>>;
    name?: string;
    nullable?: boolean;
    propertyName?: keyof TSource;
    relationColumns: Array<IColumnMetaData<TSource>>;
    relationData?: IRelationDataMetaData<any, TSource, TTarget> | IRelationDataMetaData<any, TTarget, TSource>;
    relationMaps?: Map<IColumnMetaData<TSource>, IColumnMetaData<TTarget>>;
    relationType: RelationshipType;
    reverseRelation?: IRelationMetaData<TTarget, TSource>;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    updateOption?: ReferenceOption;
    completeRelation?(reverseRelation: IRelationMetaData<TTarget, TSource>): void;
}

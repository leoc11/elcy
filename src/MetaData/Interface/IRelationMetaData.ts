import { RelationshipType, ReferenceOption, CompleteRelationshipType } from "../../Common/Type";
import { IEntityMetaData } from "./IEntityMetaData";
import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationDataMetaData } from "./IRelationDataMetaData";
import { Enumerable } from "../../Enumerable/Enumerable";

export interface IRelationMetaData<TSource = any, TTarget = any> {
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
    completeRelation?(reverseRelation: IRelationMetaData<TTarget, TSource>): void;
    relationData?: IRelationDataMetaData<any, TSource, TTarget> | IRelationDataMetaData<any, TTarget, TSource>;
    completeRelationType?: CompleteRelationshipType;

    // Helper property to improve hydration performance issue
    /**
     * Column used in relation that has been mapped to an entity's property.
     */
    mappedRelationColumns?:  Enumerable<IColumnMetaData<TSource>>;
}

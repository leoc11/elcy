import { CompleteRelationshipType, ReferenceOption, RelationshipType } from "../../Common/StringType";
import { StringKeyOf } from "../../Common/Type";
import { Enumerable } from "@elcy/enumerable";
import { IBaseRelationMetaData } from "./IBaseRelationMetaData";
import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IRelationMetaData<TSource extends object = object, TTarget extends object = object, TRel extends RelationshipType = RelationshipType> extends IBaseRelationMetaData<TSource, TTarget> {
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
    propertyName?: StringKeyOf<TSource>;
    relationColumns: Array<IColumnMetaData<TSource>>;
    relationMaps?: Map<IColumnMetaData<TSource>, IColumnMetaData<TTarget>>;
    relationType: TRel;
    reverseRelation?: IRelationMetaData<TTarget, TSource>;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    updateOption?: ReferenceOption;
    completeRelation?(reverseRelation: IRelationMetaData<TTarget, TSource>): void;
}

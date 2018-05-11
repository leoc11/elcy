import { RelationshipType, ReferenceOption } from "../../Common/Type";
import { IEntityMetaData } from ".";
import { IColumnMetaData } from "./IColumnMetaData";

export interface IRelationMetaData<TSource = any, TTarget = any> {
    name: string;
    relationType: RelationshipType;
    relationColumns: Array<IColumnMetaData<TSource>>;
    isMaster: boolean;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    reverseRelation?: IRelationMetaData<TTarget, TSource>;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
    nullable?: boolean;
}

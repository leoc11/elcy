import { RelationshipType } from "../../Common/Type";
import { IEntityMetaData } from ".";

export interface IRelationMetaData<TSource = any, TTarget = any> {
    name: string;
    relationType: RelationshipType;
    relationKeys: Array<keyof TSource>;
    isMaster: boolean;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    reverseRelation?: IRelationMetaData<TTarget, TSource>;
}

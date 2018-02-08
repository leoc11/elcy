import { IObjectType, RelationType } from "../../Common/Type";

export interface IRelationMetaData<TSlave, TMaster> {
    slaveType?: IObjectType<TSlave>;
    masterType?: IObjectType<TMaster>;
    relationType?: RelationType;
    foreignKeyName?: string;
    relationMaps?: {[key in keyof TSlave]?: keyof TMaster } | {[key in keyof TMaster]?: keyof TSlave };
    reverseProperty?: string;
}

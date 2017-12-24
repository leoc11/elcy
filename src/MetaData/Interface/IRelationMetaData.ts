import { genericType, RelationType } from "../../Common/Type";

export interface IRelationMetaData<TSlave, TMaster> {
    slaveType?: genericType<TSlave>;
    masterType?: genericType<TMaster>;
    relationType?: RelationType;
    foreignKeyName?: string;
    relationMap?: {[key in keyof TSlave]?: keyof TMaster } | {[key in keyof TMaster]?: keyof TSlave };
}

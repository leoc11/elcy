import { IEntityMetaData, IRelationMetaData } from "src/MetaData";

export type EntityCommitPlan = {
    entityMeta: IEntityMetaData;
    config: CommitPlanConfig;
};
export type CommitPlanConfig = {
    isSelfReference: boolean;
    relationBreaks: IRelationMetaData[];
}
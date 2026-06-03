import { IEntityMetaData, IRelationMetaData } from "src/MetaData";

export type EntityCommitPlan = {
    entityMeta: IEntityMetaData;
    config: CommitPlanConfig;
};
export type CommitPlanConfig = {
    selfReferences: Set<IRelationMetaData>;
    relationBreaks: Set<IRelationMetaData>;
    uniqueColumns: Set<string>;
}
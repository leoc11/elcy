import { IEnumerable, Enumerable } from "@elcy/enumerable";
import { IEntityMetaData } from "src/MetaData";
import { CommitPlanConfig, EntityCommitPlan } from "./EntityCommitPlan";


export class CommitPlan {
    private planConfigMap: Map<IEntityMetaData, CommitPlanConfig>;
    constructor(private commitPlans: EntityCommitPlan[]) {
        this.planConfigMap = Enumerable.from(commitPlans).toMap(o => o.entityMeta, o => o.config);
    }

    public sort(entities: IEnumerable<IEntityMetaData>): Enumerable<EntityCommitPlan> {
        const entitySet = new Set(entities);
        return Enumerable.from(this.commitPlans)
            .filter(o => entitySet.has(o.entityMeta));
    }
    public reverseSort(entities: IEnumerable<IEntityMetaData>): Enumerable<EntityCommitPlan> {
        const entitySet = new Set(entities);
        return Enumerable.from(this.commitPlans.reverse())
            .filter(o => entitySet.has(o.entityMeta));
    }
    public getConfig(entityMeta: IEntityMetaData) {
        return this.planConfigMap.get(entityMeta);
    }
}

import { genericType, RelationType } from "./Types";

export class RelationMetaData<TSource, TTarget, TSourceKey extends keyof TSource, TTargetKey extends keyof TTarget> {
    constructor(public sourceType: genericType<TSource>, public targetType: genericType<TTarget>, public name: string, public relationMaps: Array<{ source: TSourceKey, target: TTargetKey }>, public relationType: RelationType) {
    }
}

import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { genericType, ReferenceOption, RelationType } from "./Types";

export class RelationMetaData<TSource, TTarget, TSourceKey extends keyof TSource, TTargetKey extends keyof TTarget> implements IRelationMetaData<TSource, TTarget, TSourceKey, TTargetKey> {
    public sourceType: genericType<TSource>;
    constructor(
        sourceType: genericType<TSource> | IRelationMetaData<TSource, TTarget, TSourceKey, TTargetKey>,
        public targetType?: genericType<TTarget>,
        public relationMaps?: Array<{ source: TSourceKey, target: TTargetKey }>,
        public relationType = RelationType.OneToOne,
        public foreignKeyName?: string,
        public updateOption = ReferenceOption.NOACTION,
        public deleteOption = ReferenceOption.NOACTION
    ) {
        if (typeof sourceType === "object")
            this.Copy(sourceType);
        else
            this.sourceType = sourceType;
    }

    public Copy(relationMeta: IRelationMetaData<any, any, any, any>) {
        if (typeof relationMeta.sourceType !== "undefined")
            this.sourceType = relationMeta.sourceType;
        if (typeof relationMeta.targetType !== "undefined")
            this.targetType = relationMeta.targetType;
        if (typeof relationMeta.relationMaps !== "undefined")
            this.relationMaps = relationMeta.relationMaps;
        if (typeof relationMeta.relationType !== "undefined")
            this.relationType = relationMeta.relationType;
        if (typeof relationMeta.foreignKeyName !== "undefined")
            this.foreignKeyName = relationMeta.foreignKeyName;
        if (typeof relationMeta.updateOption !== "undefined")
            this.updateOption = relationMeta.updateOption;
        if (typeof relationMeta.foreignKeyName !== "undefined")
            this.foreignKeyName = relationMeta.foreignKeyName;
    }

    get isSource(): boolean {
        return !!this.foreignKeyName;
    }
}

import { RelationMetaData } from ".";
import { IRelationDataOption } from "../../Decorator/Option/IRelationDataOption";
import { IObjectType } from "../../Common/Type";
import { IEntityMetaData } from "../Interface/IEntityMetaData";
import { IColumnMetaData } from "../Interface/IColumnMetaData";

export class RelationDataMetaData<TType = any, TSource = any, TTarget = any> implements IRelationDataOption<TType, TSource, TTarget> {
    public get sourceType(): IObjectType<TSource> {
        return this.sourceRelationMeta.sourceType;
    }
    public get targetType(): IObjectType<TTarget> {
        return this.targetRelationMeta.sourceType;
    }
    public sourceRelationKeys: string[] = [];
    public targetRelationKeys: string[] = [];
    public sourceRelationMeta: RelationMetaData<TSource, TTarget>;
    public targetRelationMeta: RelationMetaData<TTarget, TSource>;
    public columns: IColumnMetaData<TType>[] = [];
    public relationName: string;
    public name: string;
    public type: IObjectType<TType>;
    public sourceRelationMaps: Map<any, any> = new Map();
    public targetRelationMaps: Map<any, any> = new Map();
    public get completeRelationType() {
        return this.sourceRelationMeta.completeRelationType;
    }
    constructor(relationOption: IRelationDataOption<TType, TSource, TTarget>) {
        this.name = relationOption.name;
        this.relationName = relationOption.relationName;
        this.sourceRelationKeys = relationOption.sourceRelationKeys;
        this.targetRelationKeys = relationOption.targetRelationKeys;
        this.type = relationOption.type;
    }
    public completeRelation(sourceRelation: RelationMetaData<TSource, TTarget>, targetRelation: RelationMetaData<TTarget, TSource>) {
        this.sourceRelationMeta = sourceRelation;
        this.targetRelationMeta = targetRelation;
        sourceRelation.relationData = sourceRelation.relationData = this;

        this.sourceRelationMeta.completeRelation(this.targetRelationMeta);

        const isManyToMany = (this.sourceRelationMeta.relationType === "many") && (this.targetRelationMeta.relationType === "many");
        for (let i = 0; i < this.sourceRelationKeys.length; i++) {
            const dataKey = this.sourceRelationKeys[i];
            const sourceKey = this.sourceRelationMeta.relationKeys[i];
            this.sourceRelationMaps.set(dataKey, sourceKey);
            if (isManyToMany)
                this.sourceRelationMeta.relationMaps.set(sourceKey, dataKey);
        }
        for (let i = 0; i < this.targetRelationKeys.length; i++) {
            const dataKey = this.targetRelationKeys[i];
            const targetKey = this.targetRelationMeta.relationKeys[i];
            this.targetRelationMaps.set(dataKey, targetKey);
            if (isManyToMany)
                this.targetRelationMeta.relationMaps.set(targetKey, dataKey);
        }
    }

    public ApplyOption(entityMeta: IEntityMetaData<TType>) {
        if (typeof entityMeta.columns !== "undefined")
            this.columns = entityMeta.columns;
    }
}

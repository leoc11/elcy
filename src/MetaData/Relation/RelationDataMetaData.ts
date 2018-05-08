import { RelationMetaData } from ".";
import { IRelationDataOption } from "../../Decorator/Option/IRelationDataOption";
import { IObjectType } from "../../Common/Type";
import { IEntityMetaData } from "../Interface/IEntityMetaData";
import { IColumnMetaData } from "../Interface/IColumnMetaData";
import { IRelationDataMetaData } from "../Interface/IRelationDataMetaData";
import { columnMetaKey } from "../../Decorator/DecoratorKey";

export class RelationDataMetaData<TType = any, TSource = any, TTarget = any> implements IRelationDataMetaData<TType, TSource, TTarget> {
    public get source() {
        return this.sourceRelationMeta.source;
    }
    public get target() {
        return this.targetRelationMeta.source;
    }
    public sourceRelationColumns: IColumnMetaData<TSource>[] = [];
    public targetRelationColumns: IColumnMetaData<TTarget>[] = [];
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

        // TODO: possible failed coz relationOption.targetType / sourceType may undefined|string
        this.sourceRelationColumns = relationOption.sourceRelationKeys.select(o => Reflect.getOwnMetadata(columnMetaKey, relationOption.sourceType, o)).toArray();
        this.targetRelationColumns = relationOption.targetRelationKeys.select(o => Reflect.getOwnMetadata(columnMetaKey, relationOption.targetType, o)).toArray();
        this.type = relationOption.type;
    }
    public completeRelation(sourceRelation: RelationMetaData<TSource, TTarget>, targetRelation: RelationMetaData<TTarget, TSource>) {
        this.sourceRelationMeta = sourceRelation;
        this.targetRelationMeta = targetRelation;
        sourceRelation.relationData = sourceRelation.relationData = this;

        this.sourceRelationMeta.completeRelation(this.targetRelationMeta);

        const isManyToMany = (this.sourceRelationMeta.relationType === "many") && (this.targetRelationMeta.relationType === "many");
        for (let i = 0; i < this.sourceRelationColumns.length; i++) {
            const dataKey = this.sourceRelationColumns[i];
            const sourceKey = this.sourceRelationMeta.relationColumns[i];
            this.sourceRelationMaps.set(dataKey, sourceKey);
            if (isManyToMany)
                this.sourceRelationMeta.relationMaps.set(sourceKey, dataKey);
        }
        for (let i = 0; i < this.targetRelationColumns.length; i++) {
            const dataKey = this.targetRelationColumns[i];
            const targetKey = this.targetRelationMeta.relationColumns[i];
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

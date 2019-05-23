import { IObjectType } from "../../Common/Type";
import { columnMetaKey } from "../../Decorator/DecoratorKey";
import { IRelationDataOption } from "../../Decorator/Option/IRelationDataOption";
import { IColumnMetaData } from "../Interface/IColumnMetaData";
import { IConstraintMetaData } from "../Interface/IConstraintMetaData";
import { IEntityMetaData } from "../Interface/IEntityMetaData";
import { IIndexMetaData } from "../Interface/IIndexMetaData";
import { IRelationDataMetaData } from "../Interface/IRelationDataMetaData";
import { IRelationMetaData } from "../Interface/IRelationMetaData";
import { InheritanceMetaData } from "./InheritanceMetaData";

export class RelationDataMetaData<TType = any, TSource = any, TTarget = any> implements IRelationDataMetaData<TType, TSource, TTarget> {
    public inheritance: InheritanceMetaData<TType>;
    public relations: Array<IRelationMetaData<TType, any>> = [];
    public indices: Array<IIndexMetaData<TType>> = [];
    public constraints: Array<IConstraintMetaData<TType>> = [];
    public get source() {
        return this.sourceRelationMeta.source;
    }
    public get target() {
        return this.targetRelationMeta.source;
    }
    public get primaryKeys() {
        return this.sourceRelationColumns.union(this.targetRelationColumns).toArray();
    }
    public sourceRelationColumns: Array<IColumnMetaData<TType>> = [];
    public targetRelationColumns: Array<IColumnMetaData<TType>> = [];
    public sourceRelationMeta: IRelationMetaData<TSource, TTarget>;
    public targetRelationMeta: IRelationMetaData<TTarget, TSource>;
    public columns: Array<IColumnMetaData<TType>> = [];
    public relationName: string;
    public name: string;
    public type: IObjectType<TType>;
    public sourceRelationMaps: Map<IColumnMetaData<TType>, IColumnMetaData<TSource>> = new Map();
    public targetRelationMaps: Map<IColumnMetaData<TType>, IColumnMetaData<TTarget>> = new Map();
    public get completeRelationType() {
        return this.sourceRelationMeta.completeRelationType;
    }
    constructor(relationOption: IRelationDataOption<TType, TSource, TTarget>) {
        this.inheritance = new InheritanceMetaData(this);
        this.name = relationOption.name;
        this.relationName = relationOption.relationName;

        // TODO: possible failed coz relationOption.targetType / sourceType may undefined|string
        this.sourceRelationColumns = relationOption.sourceRelationKeys.select((o) => Reflect.getOwnMetadata(columnMetaKey, relationOption.type, o)).toArray();
        this.targetRelationColumns = relationOption.targetRelationKeys.select((o) => Reflect.getOwnMetadata(columnMetaKey, relationOption.type, o)).toArray();
        this.type = relationOption.type;
    }
    public completeRelation(sourceRelation: IRelationMetaData<TSource, TTarget>, targetRelation: IRelationMetaData<TTarget, TSource>) {
        this.sourceRelationMeta = sourceRelation;
        this.targetRelationMeta = targetRelation;
        sourceRelation.relationData = this;
        targetRelation.relationData = this;
        sourceRelation.isMaster = targetRelation.isMaster = true;

        this.sourceRelationMaps = new Map();
        this.targetRelationMaps = new Map();
        this.sourceRelationMeta.completeRelation(this.targetRelationMeta);

        const isManyToMany = (this.sourceRelationMeta.relationType === "many") && (this.targetRelationMeta.relationType === "many");
        const len = this.sourceRelationColumns.length;
        for (let i = 0; i < len; i++) {
            const dataKey = this.sourceRelationColumns[i];
            const sourceKey = this.sourceRelationMeta.relationColumns[i];
            this.sourceRelationMaps.set(dataKey, sourceKey);
            if (isManyToMany) {
                this.sourceRelationMeta.relationMaps.set(sourceKey, dataKey);
            }
        }
        for (let i = 0; i < len; i++) {
            const dataKey = this.targetRelationColumns[i];
            const targetKey = this.targetRelationMeta.relationColumns[i];
            this.targetRelationMaps.set(dataKey, targetKey);
            if (isManyToMany) {
                this.targetRelationMeta.relationMaps.set(targetKey, dataKey);
            }
        }
    }
    public ApplyOption(entityMeta: IEntityMetaData<TType>) {
        if (typeof entityMeta.columns !== "undefined") {
            this.columns = entityMeta.columns;
            this.columns.forEach((o) => o.entity = this);
        }
    }
}

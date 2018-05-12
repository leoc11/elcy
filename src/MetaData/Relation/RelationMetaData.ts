import { RelationshipType, CompleteRelationshipType, ReferenceOption } from "../../Common/Type";
import { entityMetaKey, columnMetaKey } from "../../Decorator/DecoratorKey";
import { IRelationOption } from "../../Decorator/Option";
import { FunctionHelper } from "../../Helper/FunctionHelper";
import { RelationDataMetaData } from "./RelationDataMetaData";
import { IRelationMetaData } from "../Interface/IRelationMetaData";
import { IColumnMetaData } from "../Interface/IColumnMetaData";
import { IEntityMetaData } from "../Interface";

export class RelationMetaData<TSource, TTarget> implements IRelationMetaData<TSource, TTarget> {
    public relationMaps: Map<IColumnMetaData<TSource>, IColumnMetaData> = new Map();
    public propertyName: keyof TSource;
    public reverseRelation: IRelationMetaData<TTarget, TSource>;
    public relationData: RelationDataMetaData;
    public source: IEntityMetaData<TSource>;
    public target: IEntityMetaData<TTarget>;
    public name: string;
    public relationType: RelationshipType;
    public relationColumns: Array<IColumnMetaData<TSource>> = [];
    public isMaster: boolean;
    public updateOption?: ReferenceOption;
    public deleteOption?: ReferenceOption;
    public nullable?: boolean;
    public get completeRelationType(): CompleteRelationshipType {
        return this.relationType + "-" + this.reverseRelation.relationType as any;
    }
    constructor(relationOption: IRelationOption<TSource, TTarget>) {
        this.name = relationOption.name;
        this.isMaster = relationOption.isMaster;
        this.relationType = relationOption.relationType;
        this.propertyName = relationOption.propertyName;

        this.source = Reflect.getOwnMetadata(entityMetaKey, relationOption.sourceType);

        if (relationOption.targetType)
            this.target = Reflect.getOwnMetadata(entityMetaKey, relationOption.targetType);

        this.relationColumns = relationOption.relationKeys.select(o => typeof o === "string" ? o : FunctionHelper.propertyName(o))
            .select(o => Reflect.getOwnMetadata(columnMetaKey, relationOption.sourceType, o) as IColumnMetaData<TSource>).toArray();
    }
    public completeRelation(reverseRelation: IRelationMetaData<TTarget, TSource>) {
        if (this.isMaster) {
            this.reverseRelation = reverseRelation;
            this.reverseRelation.reverseRelation = this;
            // set each target for to make sure no problem
            this.target = this.reverseRelation.source;
            this.reverseRelation.target = this.source;

            this.reverseRelation.isMaster = false;

            const isManyToMany = this.relationType === "many" && reverseRelation.relationType === "many";
            if (!isManyToMany) {
                // set relation maps. Many to Many relation map will be set by RelationData
                if (this.relationColumns.length <= 0) {
                    // set default value.
                    if (this.relationType === "many" && this.reverseRelation.relationType === "one") {
                        // this is a foreignkey
                        this.relationColumns = [this.name + "_" + this.target.type.name + "_Id" as any];
                    }
                    else {
                        this.relationColumns = this.relationColumns.concat(this.source.primaryKeys);
                    }
                }
                for (let i = 0; i < this.relationColumns.length; i++) {
                    this.relationMaps.set(this.relationColumns[i], this.reverseRelation.relationColumns[i]);
                    this.reverseRelation.relationMaps.set(this.reverseRelation.relationColumns[i], this.relationColumns[i]);
                }
            }
        }
        else {
            reverseRelation.completeRelation(this);
        }
    }
}

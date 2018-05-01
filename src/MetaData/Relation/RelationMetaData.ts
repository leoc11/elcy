import { IObjectType, RelationshipType, CompleteRelationshipType } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../EntityMetaData";
import { IRelationOption } from "../../Decorator/Option";
import { FunctionHelper } from "../../Helper/FunctionHelper";
import { RelationDataMetaData } from "./RelationDataMetaData";

export class RelationMetaData<TSource, TTarget> {
    public relationMaps: Map<any, any> = new Map();
    public propertyName: keyof TSource;
    public reverseRelation: RelationMetaData<TTarget, TSource>;
    public relationData: RelationDataMetaData;
    public sourceType: IObjectType<TSource>;
    public targetType: IObjectType<TTarget>;
    public name: string;
    public relationType: RelationshipType;
    public relationKeys: Array<keyof TSource> = [];
    public isMaster: boolean;
    public get completeRelationType(): CompleteRelationshipType {
        return this.relationType + "-" + this.reverseRelation.relationType as any;
    }
    constructor(relationOption: IRelationOption<TSource, TTarget>) {
        this.sourceType = relationOption.sourceType;
        this.targetType = relationOption.targetType;
        this.name = relationOption.name;
        this.isMaster = relationOption.isMaster;
        this.relationType = relationOption.relationType;
        this.propertyName = relationOption.propertyName;
        this.relationKeys = relationOption.relationKeys.select(o => typeof o === "string" ? o : FunctionHelper.propertyName(o)).toArray();
    }
    public completeRelation(reverseRelation: RelationMetaData<TTarget, TSource>) {
        if (this.isMaster) {
            this.reverseRelation = reverseRelation;
            this.reverseRelation.reverseRelation = this;
            // set each target for to make sure no problem
            this.targetType = this.reverseRelation.sourceType;
            this.reverseRelation.targetType = this.sourceType;

            this.reverseRelation.isMaster = false;

            const isManyToMany = this.relationType === "many" && reverseRelation.relationType === "many";
            if (!isManyToMany) {
                // set relation maps. Many to Many relation map will be set by RelationData
                if (this.relationKeys.length <= 0) {
                    // set default value.
                    if (this.relationType === "many" && this.reverseRelation.relationType === "one") {
                        // this is a foreignkey
                        this.relationKeys = [this.name + "_" + this.targetType.name + "_Id" as any];
                    }
                    else {
                        const entityMeta: EntityMetaData<TSource> = Reflect.getOwnMetadata(entityMetaKey, this.sourceType);
                        this.relationKeys = this.relationKeys.concat(entityMeta.primaryKeys);
                    }
                }
                for (let i = 0; i < this.relationKeys.length; i++) {
                    this.relationMaps.set(this.relationKeys[i], this.reverseRelation.relationKeys[i]);
                    this.reverseRelation.relationMaps.set(this.reverseRelation.relationKeys[i], this.relationKeys[i]);
                }
            }
        }
        else {
            reverseRelation.completeRelation(this);
        }
    }
}

import { IObjectType, RelationshipType } from "../../Common/Type";
import { entityMetaKey } from "../../Decorator/DecoratorKey";
import { EntityMetaData } from "../EntityMetaData";
import { IRelationOption } from "../../Decorator/Option";
import { FunctionHelper } from "../../Helper/FunctionHelper";

export class RelationMetaData<TSource, TTarget> {
    public relationMaps: Map<any, any> = new Map();
    public propertyName: string;
    public reverseRelation: RelationMetaData<TTarget, TSource>;
    public sourceType: IObjectType<TSource>;
    public targetType: IObjectType<TTarget>;
    public metaType?: IObjectType<any>;
    private _metaName: string;
    public get metaName() {
        if (!this._metaName && this.metaType) {
            this._metaName = this.metaType.name;
        }
        return this._metaName;
    }
    public set metaName(value) {
        this._metaName = value;
    }
    public name: string;
    public relationType: RelationshipType;
    protected relationKeys: string[] = [];
    public isMaster: boolean;
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
            this.reverseRelation.metaType = this.metaType;
            this.reverseRelation.metaName = this.metaName;

            // set relation maps.
            if (this.relationKeys.length <= 0) {
                // set default value.
                if (this.relationType === "many" && this.reverseRelation.relationType === "one") {
                    // this is a foreignkey
                    this.relationKeys = [this.name + "_" + this.targetType.name + "_Id"];
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
        else {
            reverseRelation.completeRelation(this);
        }
    }
}

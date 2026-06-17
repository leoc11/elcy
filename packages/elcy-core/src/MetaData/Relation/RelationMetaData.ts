import { CompleteRelationshipType, ReferenceOption, RelationshipType } from "../../Common/StringType";
import { IRelationData } from "../../Decorator/Option/IRelationOption";
import { Enumerable } from "@elcy/enumerable";
import { IColumnMetaData } from "../Interface/IColumnMetaData";
import { IEntityMetaData } from "../Interface/IEntityMetaData";
import { IRelationMetaData } from "../Interface/IRelationMetaData";
import { StringKeyOf } from "src/Common/Type";

export class RelationMetaData<TSource extends object = object, TTarget extends object = object> implements IRelationMetaData<TSource, TTarget> {
    public get completeRelationType(): CompleteRelationshipType {
        return this.relationType + "-" + this.reverseRelation.relationType as any;
    }
    public get mappedRelationColumns(): Enumerable {
        return Enumerable.from(this.relationColumns).intersect(Object.values(this.source.properties));
    }
    constructor(option: IRelationData<TSource, TTarget>) {
        this.name = option.name;
        this.isMaster = option.isMaster;
        this.propertyName = option.propertyName;
        this.source = option.metaData;

        if (!option.isMaster) {
            this.target = option.targetMetaData;
            this.relationColumns = Array.from(option.relationMap.keys());
            this.relationType = "one";
            this.nullable = this.relationColumns.every(o => o.nullable);
            this.relationMaps = option.relationMap;
            this.fullName = option.relationKeyName;

            if (!this.nullable && (this.deleteOption === "SET NULL" || this.updateOption === "SET NULL")) {
                throw new Error(`Relation ${this.name} option is "SET NULL" but relation is not nullable`);
            }
            if (this.relationColumns.some((o) => !o.defaultExp && !o.nullable) && (this.deleteOption === "SET DEFAULT" || this.updateOption === "SET DEFAULT")) {
                throw new Error(`Relation ${this.name} option is "SET DEFAULT" but has column without default and not nullable`);
            }
        }
    }
    public deleteOption?: ReferenceOption;
    public fullName: string;
    public isMaster: boolean;
    public name: string;
    public nullable?: boolean;
    public propertyName: StringKeyOf<TSource>;
    public relationColumns: Array<IColumnMetaData<TSource>> = [];
    public relationMaps: Map<IColumnMetaData<TSource>, IColumnMetaData<TTarget>>;
    public relationType: RelationshipType;
    public reverseRelation: IRelationMetaData<TTarget, TSource>;
    public source: IEntityMetaData<TSource>;
    public target: IEntityMetaData<TTarget>;
    public updateOption?: ReferenceOption;
    public completeRelation(reverseRelation: IRelationMetaData<TTarget, TSource>) {
        if (!this.isMaster) {
            return;
        }

        this.relationMaps = Enumerable.from(reverseRelation.relationMaps).toMap(o => o[1], o => o[0]);
        this.relationColumns = Array.from(this.relationMaps.keys());
        this.relationType = reverseRelation.source.primaryKeys.every(o => reverseRelation.relationColumns.includes(o)) ? "one" : "many";
        this.nullable = this.relationType === "one";
        this.reverseRelation = reverseRelation;
        this.target = reverseRelation.source;

        // Validate relation option.
        if (this.reverseRelation.deleteOption === "SET DEFAULT" || this.reverseRelation.updateOption === "SET DEFAULT") {
            if (this.reverseRelation.relationColumns.some((o) => !o.defaultExp && !o.nullable)) {
                throw new Error(`Relation ${this.name} option is "SET DEFAULT" but has column without default and not nullable`);
            }
        }

        reverseRelation.reverseRelation = this;
        if (!reverseRelation.fullName) {
            reverseRelation.fullName = `${reverseRelation.name}_${reverseRelation.target.name}_${reverseRelation.source.name}`;
        }
        this.fullName = reverseRelation.fullName;
    }
}

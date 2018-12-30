import { RelationshipType, CompleteRelationshipType, ReferenceOption } from "../../Common/Type";
import { entityMetaKey, columnMetaKey } from "../../Decorator/DecoratorKey";
import { IRelationOption } from "../../Decorator/Option/IRelationOption";
import { FunctionHelper } from "../../Helper/FunctionHelper";
import { RelationDataMetaData } from "./RelationDataMetaData";
import { IRelationMetaData } from "../Interface/IRelationMetaData";
import { IColumnMetaData } from "../Interface/IColumnMetaData";
import { IEntityMetaData } from "../Interface/IEntityMetaData";
import { Enumerable } from "../../Enumerable/Enumerable";
import { ColumnMetaData } from "../ColumnMetaData";

export class RelationMetaData<TSource, TTarget> implements IRelationMetaData<TSource, TTarget> {
    public relationMaps: Map<IColumnMetaData<TSource>, IColumnMetaData> = new Map();
    public propertyName: keyof TSource;
    public reverseRelation: IRelationMetaData<TTarget, TSource>;
    public relationData: RelationDataMetaData<any, TSource, TTarget> | RelationDataMetaData<any, TTarget, TSource>;
    public source: IEntityMetaData<TSource>;
    public target: IEntityMetaData<TTarget>;
    public name: string;
    public fullName: string;
    public relationType: RelationshipType;
    public relationColumns: Array<IColumnMetaData<TSource>> = [];
    public isMaster: boolean;
    public updateOption?: ReferenceOption;
    public deleteOption?: ReferenceOption;
    public nullable?: boolean;
    public get completeRelationType(): CompleteRelationshipType {
        return this.relationType + "-" + this.reverseRelation.relationType as any;
    }
    public get mappedRelationColumns(): Enumerable {
        return this.relationColumns.intersect(this.source.columns);
    }
    constructor(relationOption: IRelationOption<TSource, TTarget>, isMaster: boolean) {
        this.name = relationOption.name;
        this.isMaster = isMaster;
        if (relationOption.relationType === "one?") {
            this.relationType = "one";
            this.nullable = true;
        }
        else {
            this.relationType = relationOption.relationType;
        }
        this.propertyName = relationOption.propertyName;

        this.source = Reflect.getOwnMetadata(entityMetaKey, relationOption.sourceType);

        if (relationOption.targetType)
            this.target = Reflect.getOwnMetadata(entityMetaKey, relationOption.targetType);

        this.relationColumns = relationOption.relationKeys.select(o => typeof o === "string" ? o : FunctionHelper.propertyName(o))
            .select(o => {
                let col = Reflect.getOwnMetadata(columnMetaKey, relationOption.sourceType, o) as IColumnMetaData<TSource>;
                if (!col) {
                    // either column will be defined later or column is not mapped.
                    col = new ColumnMetaData<TSource>();
                    col.entity = this.source;
                    col.columnName = o;
                    col.nullable = this.nullable || this.deleteOption === "SET NULL";
                    Reflect.defineMetadata(columnMetaKey, col, relationOption.sourceType, o);
                }
                return col;
            }).toArray();
    }
    public completeRelation(reverseRelation: IRelationMetaData<TTarget, TSource>) {
        if (this.isMaster) {
            this.reverseRelation = reverseRelation;
            this.reverseRelation.reverseRelation = this;
            // set each target for to make sure no problem
            this.target = this.reverseRelation.source;
            this.reverseRelation.target = this.source;
            this.reverseRelation.isMaster = false;

            // validate nullable
            if (typeof this.reverseRelation.nullable !== "boolean") {
                this.reverseRelation.nullable = this.reverseRelation.relationColumns.all(o => o.nullable);
            }
            else if (this.reverseRelation.nullable && this.reverseRelation.relationColumns.any(o => !o.nullable)) {
                throw new Error(`Relation ${this.name} is nullable but it's dependent column is not nullable`);
            }

            // Validate relation option.
            if (this.reverseRelation.deleteOption === "SET NULL" || this.reverseRelation.updateOption === "SET NULL") {
                if (!this.reverseRelation.nullable)
                    throw new Error(`Relation ${this.reverseRelation.name} option is "SET NULL" but relation is not nullable`);
            }
            if (this.reverseRelation.deleteOption === "SET DEFAULT" || this.reverseRelation.updateOption === "SET DEFAULT") {
                if (this.reverseRelation.relationColumns.any(o => !o.default && !o.nullable))
                    throw new Error(`Relation ${this.name} option is "SET DEFAULT" but has column without default and not nullable`);
            }

            if (this.completeRelationType !== "many-many") {
                // set relation maps. Many to Many relation map will be set by RelationData
                if (this.relationColumns.length <= 0) {
                    // set default value.
                    if (this.relationType === "many" && this.reverseRelation.relationType === "one") {
                        // this is a foreignkey
                        this.relationColumns = [this.fullName + "_" + this.target.type.name + "_Id" as any];
                    }
                    else {
                        this.relationColumns = this.relationColumns.concat(this.source.primaryKeys);
                    }
                }
                for (let i = 0, len = this.relationColumns.length; i < len; i++) {
                    const col = this.relationColumns[i];
                    const reverseCol = this.reverseRelation.relationColumns[i];
                    if (!reverseCol.type) {
                        // reverseCol is a non-mapped column
                        reverseCol.type = col.type;
                        reverseCol.columnType = col.columnType;
                        (reverseCol as any).scale = (col as any).scale;
                        (reverseCol as any).length = (col as any).length;
                        (reverseCol as any).precision = (col as any).precision;
                    }

                    this.relationMaps.set(col, reverseCol);
                    this.reverseRelation.relationMaps.set(reverseCol, col);
                }
            }
        }
        else {
            reverseRelation.completeRelation(this);
        }
    }
}

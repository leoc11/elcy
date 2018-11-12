import { IObjectType, ConcurrencyModel, ColumnGeneration } from "../Common/Type";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { IIndexMetaData } from "./Interface/IIndexMetaData";
import { IConstraintMetaData } from "./Interface/IConstraintMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { ComputedColumnMetaData } from "./ComputedColumnMetaData";
import { InheritanceMetaData } from "./Relation/InheritanceMetaData";
import { IntegerColumnMetaData } from "./IntegerColumnMetaData";
import { ISaveEventParam } from "./Interface/ISaveEventParam";
import { IDeleteEventParam } from "./Interface/IDeleteEventParam";
import { isNotNull } from "../Helper/Util";
import { RowVersionColumnMetaData } from "./RowVersionColumnMetaData";
import { BooleanColumnMetaData } from "./BooleanColumnMetaData";
import { DateTimeColumnMetaData } from "./DateTimeColumnMetaData";
import { IOrderQueryDefinition } from "../Queryable/Interface/IOrderQueryDefinition";

export class EntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public schema: string = "dbo";
    public name: string;
    public defaultOrders?: IOrderQueryDefinition<TE>[];
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deletedColumn: BooleanColumnMetaData<TE>;
    public createDateColumn: DateTimeColumnMetaData<TE>;
    public modifiedDateColumn: DateTimeColumnMetaData<TE>;
    public versionColumn?: RowVersionColumnMetaData<TE>;
    public columns: IColumnMetaData<TE>[] = [];
    public indices: IIndexMetaData<TE>[] = [];
    public constraints: IConstraintMetaData<TE>[] = [];
    public relations: IRelationMetaData<TE, any>[] = [];
    public computedProperties: ComputedColumnMetaData<TE>[] = [];

    public concurencyModel: ConcurrencyModel;
    // inheritance
    public descriminatorMember = "__type__";
    public get allowInheritance(): boolean {
        return !!this.descriminatorMember;
    }
    public inheritance: InheritanceMetaData<TParent>;
    public get priority(): number {
        let priority = 1;
        for (const relation of this.relations) {
            if (!relation.isMaster && !relation.nullable) {
                priority += relation.target.priority + 1;
            }
        }
        return priority;
    }
    public get hasIncrementPrimary(): boolean {
        return this.primaryKeys.any(o => (o as any as IntegerColumnMetaData).autoIncrement);
    }
    constructor(public type: IObjectType<TE>, name?: string) {
        this.inheritance = new InheritanceMetaData(this);
        if (typeof name !== "undefined")
            this.name = name;
        if (!name)
            this.name = type.name!;
    }

    public applyOption(entityMeta: IEntityMetaData<TE>) {
        if (typeof entityMeta.columns !== "undefined") {
            this.columns = entityMeta.columns;
            this.columns.forEach(o => o.entity = this);
        }
        if (typeof entityMeta.computedProperties !== "undefined") {
            this.computedProperties = entityMeta.computedProperties;
            this.computedProperties.forEach(o => o.entity = this);
        }

        if (typeof entityMeta.createDateColumn !== "undefined")
            this.createDateColumn = entityMeta.createDateColumn;
        if (typeof entityMeta.defaultOrders !== "undefined")
            this.defaultOrders = entityMeta.defaultOrders;
        if (typeof entityMeta.deletedColumn !== "undefined")
            this.deletedColumn = entityMeta.deletedColumn;
        if (typeof entityMeta.indices !== "undefined")
            this.indices = entityMeta.indices;
        if (typeof entityMeta.constraints !== "undefined")
            this.constraints = entityMeta.constraints;
        if (typeof entityMeta.modifiedDateColumn !== "undefined")
            this.modifiedDateColumn = entityMeta.modifiedDateColumn;
        if (typeof entityMeta.primaryKeys !== "undefined")
            this.primaryKeys = entityMeta.primaryKeys;
        if (typeof entityMeta.relations !== "undefined") {
            this.relations = entityMeta.relations;
            for (const rel of this.relations) {
                rel.source = this;
                if (rel.reverseRelation)
                    rel.reverseRelation.target = this;
            }
        }
    }

    public get insertGeneratedColumns() {
        return this.columns.where(o => {
            return !isNotNull(o.default) || (o.generation & ColumnGeneration.Insert) as any;
        }).toArray();
    }
    public get updateGeneratedColumns() {
        return this.columns.where(o => {
            return (o.generation & ColumnGeneration.Update) as any;
        }).toArray();
    }
    public beforeSave?: (entity: TE, param: ISaveEventParam) => boolean;
    public beforeDelete?: (entity: TE, param: IDeleteEventParam) => boolean;
    public afterLoad?: (entity: TE) => void;
    public afterSave?: (entity: TE, param: ISaveEventParam) => void;
    public afterDelete?: (entity: TE, param: IDeleteEventParam) => void;
}

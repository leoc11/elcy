import { ColumnGeneration, ConcurrencyModel, IObjectType } from "../Common/Type";
import { IOrderQueryDefinition } from "../Queryable/Interface/IOrderQueryDefinition";
import { BooleanColumnMetaData } from "./BooleanColumnMetaData";
import { DateTimeColumnMetaData } from "./DateTimeColumnMetaData";
import { EmbeddedRelationMetaData } from "./EmbeddedColumnMetaData";
import { IntegerColumnMetaData } from "./IntegerColumnMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IConstraintMetaData } from "./Interface/IConstraintMetaData";
import { IDeleteEventParam } from "./Interface/IDeleteEventParam";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IIndexMetaData } from "./Interface/IIndexMetaData";
import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { ISaveEventParam } from "./Interface/ISaveEventParam";
import { InheritanceMetaData } from "./Relation/InheritanceMetaData";
import { RowVersionColumnMetaData } from "./RowVersionColumnMetaData";

export class EntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public get allowInheritance(): boolean {
        return !!this.descriminatorMember;
    }
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
        return this.primaryKeys.any((o) => (o as any as IntegerColumnMetaData).autoIncrement);
    }

    public get insertGeneratedColumns() {
        return this.columns.where((o) => {
            return (o.generation & ColumnGeneration.Insert) as any;
        }).toArray();
    }
    public get updateGeneratedColumns() {
        return this.columns.where((o) => {
            return (o.generation & ColumnGeneration.Update) as any;
        }).toArray();
    }
    public schema: string = "dbo";
    public name: string;
    public defaultOrders?: Array<IOrderQueryDefinition<TE>>;
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deletedColumn: BooleanColumnMetaData<TE>;
    public createDateColumn: DateTimeColumnMetaData<TE>;
    public modifiedDateColumn: DateTimeColumnMetaData<TE>;
    public versionColumn?: RowVersionColumnMetaData<TE>;
    public columns: Array<IColumnMetaData<TE>> = [];
    public indices: Array<IIndexMetaData<TE>> = [];
    public constraints: Array<IConstraintMetaData<TE>> = [];
    public relations: Array<IRelationMetaData<TE, any>> = [];
    public embeds: Array<EmbeddedRelationMetaData<TE>> = [];
    public concurrencyMode: ConcurrencyModel;
    // inheritance
    public descriminatorMember = "__type__";
    public inheritance: InheritanceMetaData<TParent>;
    public beforeSave?: (entity: TE, param: ISaveEventParam) => boolean;
    public beforeDelete?: (entity: TE, param: IDeleteEventParam) => boolean;
    public afterLoad?: (entity: TE) => void;
    public afterSave?: (entity: TE, param: ISaveEventParam) => void;
    public afterDelete?: (entity: TE, param: IDeleteEventParam) => void;
    constructor(public type: IObjectType<TE>, name?: string) {
        this.inheritance = new InheritanceMetaData(this);
        if (typeof name !== "undefined") {
            this.name = name;
        }
        if (!name) {
            this.name = type.name!;
        }
    }

    public applyOption(entityMeta: IEntityMetaData<TE>) {
        if (typeof entityMeta.columns !== "undefined") {
            this.columns = entityMeta.columns;
            this.columns.forEach((o) => o.entity = this);
        }
        if (typeof entityMeta.createDateColumn !== "undefined") {
            this.createDateColumn = entityMeta.createDateColumn;
        }
        if (typeof entityMeta.defaultOrders !== "undefined") {
            this.defaultOrders = entityMeta.defaultOrders;
        }
        if (typeof entityMeta.deletedColumn !== "undefined") {
            this.deletedColumn = entityMeta.deletedColumn;
        }
        if (typeof entityMeta.indices !== "undefined") {
            this.indices = entityMeta.indices;
        }
        if (typeof entityMeta.constraints !== "undefined") {
            this.constraints = entityMeta.constraints;
        }
        if (typeof entityMeta.modifiedDateColumn !== "undefined") {
            this.modifiedDateColumn = entityMeta.modifiedDateColumn;
        }
        if (typeof entityMeta.versionColumn !== "undefined") {
            this.versionColumn = entityMeta.versionColumn;
        }
        if (typeof entityMeta.primaryKeys !== "undefined") {
            this.primaryKeys = entityMeta.primaryKeys;
        }
        if (typeof entityMeta.relations !== "undefined") {
            this.relations = entityMeta.relations;
            for (const rel of this.relations) {
                rel.source = this;
                if (rel.reverseRelation) {
                    rel.reverseRelation.target = this;
                }
            }
        }

        if (typeof entityMeta.beforeDelete !== "undefined") {
            this.beforeDelete = entityMeta.beforeDelete;
        }
        if (typeof entityMeta.beforeSave !== "undefined") {
            this.beforeSave = entityMeta.beforeSave;
        }
        if (typeof entityMeta.afterLoad !== "undefined") {
            this.afterLoad = entityMeta.afterLoad;
        }
        if (typeof entityMeta.afterSave !== "undefined") {
            this.afterSave = entityMeta.afterSave;
        }
        if (typeof entityMeta.afterDelete !== "undefined") {
            this.afterDelete = entityMeta.afterDelete;
        }
        if (typeof entityMeta.concurrencyMode !== "undefined") {
            this.concurrencyMode = entityMeta.concurrencyMode;
        }
    }
}

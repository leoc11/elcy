import { IObjectType, ConcurrencyModel } from "../Common/Type";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { IIndexMetaData } from "./Interface/IIndexMetaData";
import { IConstraintMetaData } from "./Interface/IConstraintMetaData";
import { IOrderMetaData } from "./Interface/IOrderMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { ComputedColumnMetaData } from "./ComputedColumnMetaData";
import { InheritanceMetaData } from "./Relation/InheritanceMetaData";
import { NumericColumnMetaData } from "./NumericColumnMetaData";
import { ISaveEventParam } from "./Interface/ISaveEventParam";
import { IDeleteEventParam } from "./Interface/IDeleteEventParam";

export class EntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public schema: string = "dbo";
    public name: string;
    public defaultOrder?: IOrderMetaData[];
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deletedColumn: IColumnMetaData<TE>;
    public createDateColumn: IColumnMetaData<TE>;
    public modifiedDateColumn: IColumnMetaData<TE>;
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
        return this.primaryKeys.any(o => (o as any as NumericColumnMetaData).autoIncrement);
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
        if (typeof entityMeta.defaultOrder !== "undefined")
            this.defaultOrder = entityMeta.defaultOrder;
        if (typeof entityMeta.deletedColumn !== "undefined")
            this.deletedColumn = entityMeta.deletedColumn;
        if (typeof entityMeta.indices !== "undefined")
            this.indices = entityMeta.indices;
        if (typeof entityMeta.modifiedDateColumn !== "undefined")
            this.modifiedDateColumn = entityMeta.modifiedDateColumn;
        if (typeof entityMeta.primaryKeys !== "undefined")
            this.primaryKeys = entityMeta.primaryKeys;
        if (typeof entityMeta.relations !== "undefined")
            this.relations = entityMeta.relations;
    }
    public beforeSave?: (entity: TE, param: ISaveEventParam) => boolean;
    public beforeDelete?: (entity: TE, param: IDeleteEventParam) => boolean;
    public afterLoad?: (entity: TE) => void;
    public afterSave?: (entity: TE, param: ISaveEventParam) => void;
    public afterDelete?: (entity: TE, param: IDeleteEventParam) => void;
}

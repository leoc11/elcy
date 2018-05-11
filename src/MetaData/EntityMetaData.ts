import { IObjectType } from "../Common/Type";
import { IndexMetaData, ComputedColumnMetaData } from "../MetaData";
import { IEntityMetaData, IOrderMetaData, ISaveEventParam, IDeleteEventParam } from "./Interface";
import { InheritanceMetaData, RelationMetaData } from "./Relation";
import { IColumnMetaData } from "./Interface/IColumnMetaData";

export class EntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public schema: string = "dbo";
    public name: string;
    public defaultOrder?: IOrderMetaData[];
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deleteColumn: IColumnMetaData<TE>;
    public createDateColumn: IColumnMetaData<TE>;
    public modifiedDateColumn: IColumnMetaData<TE>;
    public columns: IColumnMetaData<TE>[] = [];
    public indices: { [key: string]: IndexMetaData } = {};
    public relations: { [key: string]: RelationMetaData<TE, any> } = {};
    public computedProperties: ComputedColumnMetaData<TE>[] = [];

    // inheritance
    public descriminatorMember = "__type__";
    public get allowInheritance(): boolean {
        return !!this.descriminatorMember;
    }
    public inheritance: InheritanceMetaData<TParent>;
    public get priority(): number {
        let priority = 1;
        for (const relName in this.relations) {
            const relation = this.relations[relName];
            if (!relation.isMaster && !relation.nullable) {
                priority += relation.target.priority + 1;
            }
        }
        return priority;
    }

    constructor(public type: IObjectType<TE>, name?: string) {
        this.inheritance = new InheritanceMetaData(this);
        if (typeof name !== "undefined")
            this.name = name;
        if (!name)
            this.name = type.name!;
        this.relations = {};
    }

    public ApplyOption(entityMeta: IEntityMetaData<TE>) {
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
        if (typeof entityMeta.deleteColumn !== "undefined")
            this.deleteColumn = entityMeta.deleteColumn;
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

import { GenericType } from "../Common/Type";
import { IndexMetaData } from "../MetaData";
import { IDeleteEventParam, IEntityMetaData, IOrderCondition, ISaveEventParam } from "./Interface";
import { InheritanceMetaData } from "./Relation";
import { RelationMetaData } from "./Relation/RelationMetaData";

export class EntityMetaData<T extends TParent, TParent = any> implements IEntityMetaData<T, TParent> {
    public schema: string = "dbo";
    public name: string;
    public defaultOrder?: IOrderCondition[];
    public primaryKeys: Array<keyof T> = [];
    public deleteProperty: string;
    public createDateProperty: string;
    public modifiedDateProperty: string;
    public properties: string[] = [];
    public indices: { [key: string]: IndexMetaData } = {};
    public relations: { [key: string]: RelationMetaData<T, any> } = {};
    public computedProperties: string[] = [];

    // inheritance
    public parentType?: GenericType<TParent>;
    public descriminatorMember = "__type__";
    public get allowInheritance(): boolean {
        return !!this.descriminatorMember;
    }
    public inheritance = new InheritanceMetaData<TParent>();

    // -------------------------------------------------------------------------
    // Event Listener
    // -------------------------------------------------------------------------
    public beforeSave: (entity: T, param: ISaveEventParam) => boolean;
    public beforeDelete: (entity: T, param: IDeleteEventParam) => boolean;
    public afterLoad: (entity: T) => void;
    public afterSave: (entity: T, param: ISaveEventParam) => void;
    public afterDelete: (entity: T, param: IDeleteEventParam) => void;

    constructor(public type: GenericType<T>, name?: string, defaultOrder?: IOrderCondition[]) {
        if (typeof name !== "undefined")
            this.name = name;
        if (typeof defaultOrder !== "undefined")
            this.defaultOrder = defaultOrder;
        if (!name)
            this.name = type.name!;
    }

    public ApplyOption(entityMeta: IEntityMetaData<T>) {
        if (typeof entityMeta.computedProperties !== "undefined")
            this.computedProperties = entityMeta.computedProperties;
        if (typeof entityMeta.createDateProperty !== "undefined")
            this.createDateProperty = entityMeta.createDateProperty;
        if (typeof entityMeta.defaultOrder !== "undefined")
            this.defaultOrder = entityMeta.defaultOrder;
        if (typeof entityMeta.deleteProperty !== "undefined")
            this.deleteProperty = entityMeta.deleteProperty;
        if (typeof entityMeta.indices !== "undefined")
            this.indices = entityMeta.indices;
        if (typeof entityMeta.modifiedDateProperty !== "undefined")
            this.modifiedDateProperty = entityMeta.modifiedDateProperty;
        if (typeof entityMeta.primaryKeys !== "undefined")
            this.primaryKeys = entityMeta.primaryKeys;
        if (typeof entityMeta.relations !== "undefined")
            this.relations = entityMeta.relations;
        if (typeof entityMeta.properties !== "undefined")
            this.properties = entityMeta.properties;
    }
}

import { UniqueMetaData } from "../MetaData";
import { IEntityMetaData } from "./Interface";
import { ForeignKeyMetaData, InheritanceMetaData } from "./Relation";
import { genericType } from "./Types";

export class EntityMetaData<T extends TParent, TParent = any> implements IEntityMetaData<T, TParent> {
    public name: string;
    public defaultOrder?: (item: T) => any;
    public primaryKeys: string[] = [];
    public deleteProperty: string;
    public createDateProperty: string;
    public modifiedDateProperty: string;
    public properties: string[] = [];
    public foreignKeys: { [key: string]: ForeignKeyMetaData<T, any> } = {};
    public uniques: { [key: string]: UniqueMetaData } = {};
    public computedProperties: string[] = [];

    // inheritance
    public parentType?: genericType<TParent>;
    public descriminatorMember = "__type__";
    public get allowInheritance(): boolean {
        return !!this.descriminatorMember;
    }
    public inheritance = new InheritanceMetaData<TParent>();
    constructor(public type: genericType<T>, name?: string, defaultOrder?: (item: T) => any) {
        if (typeof name !== "undefined")
            this.name = name;
        if (typeof defaultOrder !== "undefined")
            this.defaultOrder = defaultOrder;
        if (!name)
            this.name = type.name;
    }
}

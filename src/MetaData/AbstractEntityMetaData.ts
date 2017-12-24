import { classBase, genericType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IndexMetaData } from "../MetaData";
import { InheritanceMetaData } from "../MetaData/Relation";
import { EntityMetaData } from "./EntityMetaData";
import { IEntityMetaData } from "./Interface";
import { ForeignKeyMetaData } from "./Relation";
import { ClassEventListener } from "../Common/ClassEventListener";

export class AbstractEntityMetaData<T extends TParent, TParent = any> implements IEntityMetaData<T, TParent> {
    public defaultOrder?: (item: T) => any;
    public primaryKeys: string[] = [];
    public deleteProperty?: string;
    public createDateProperty?: string;
    public modifiedDateProperty?: string;
    public properties: string[] = [];
    public foreignKeys: { [key: string]: ForeignKeyMetaData<T, any> } = {};
    public indices: { [key: string]: IndexMetaData } = {};
    public computedProperties: string[] = [];

    // inheritance
    public parentType?: genericType<TParent>;
    public allowInheritance = false;
    public inheritance = new InheritanceMetaData<TParent>();

    constructor(public type: genericType<T>, defaultOrder?: (item: T) => any) {
        if (typeof defaultOrder !== "undefined")
            this.defaultOrder = defaultOrder;

        const parentType = Reflect.getPrototypeOf(this.type) as genericType<TParent>;
        if (parentType !== classBase) {
            const parentMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            if (parentMetaData instanceof EntityMetaData && parentMetaData.allowInheritance)
                this.parentType = parentType;
        }
    }
}

import { ClassBase, GenericType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IndexMetaData } from "../MetaData";
import { InheritanceMetaData } from "../MetaData/Relation";
import { EntityMetaData } from "./EntityMetaData";
import { IEntityMetaData } from "./Interface";
import { IOrderCondition } from "./Interface/IOrderCondition";
import { ForeignKeyMetaData } from "./Relation";

export class AbstractEntityMetaData<T extends TParent, TParent = any> implements IEntityMetaData<T, TParent> {
    public defaultOrder?: IOrderCondition[];
    public primaryKeys: string[] = [];
    public deleteProperty?: string;
    public createDateProperty?: string;
    public modifiedDateProperty?: string;
    public properties: string[] = [];
    public foreignKeys: { [key: string]: ForeignKeyMetaData<T, any> } = {};
    public indices: { [key: string]: IndexMetaData } = {};
    public computedProperties: string[] = [];

    // inheritance
    public parentType?: GenericType<TParent>;
    public allowInheritance = false;
    public inheritance = new InheritanceMetaData<TParent>();

    constructor(public type: GenericType<T>, defaultOrder?: IOrderCondition[]) {
        if (typeof defaultOrder !== "undefined")
            this.defaultOrder = defaultOrder;

        const parentType = Reflect.getPrototypeOf(this.type) as GenericType<TParent>;
        if (parentType !== ClassBase) {
            const parentMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            if (parentMetaData instanceof EntityMetaData && parentMetaData.allowInheritance)
                this.parentType = parentType;
        }
    }
}

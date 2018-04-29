import { ClassBase, GenericType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IndexMetaData } from "../MetaData";
import { InheritanceMetaData, RelationMetaData } from "../MetaData/Relation";
import { EntityMetaData } from "./EntityMetaData";
import { IEntityMetaData } from "./Interface";
import { IOrderCondition } from "./Interface/IOrderCondition";

export class AbstractEntityMetaData<T extends TParent, TParent = any> implements IEntityMetaData<T, TParent> {
    public defaultOrder?: IOrderCondition[];
    public primaryKeys: Array<keyof T> = [];
    public deleteProperty?: string;
    public relations: { [key: string]: RelationMetaData<T, any> } = {};
    public createDateProperty?: string;
    public modifiedDateProperty?: string;
    public properties: string[] = [];
    public indices: { [key: string]: IndexMetaData } = {};
    public computedProperties: string[] = [];

    // inheritance
    public parentType?: GenericType<TParent>;
    public allowInheritance = false;
    public inheritance = new InheritanceMetaData<TParent>();
    public name: string;

    constructor(public type: GenericType<T>, name?: string, defaultOrder?: IOrderCondition[]) {
        if (typeof name !== "undefined")
            this.name = name;
        if (typeof defaultOrder !== "undefined")
            this.defaultOrder = defaultOrder;

        const parentType = Reflect.getPrototypeOf(this.type) as GenericType<TParent>;
        if (parentType !== ClassBase) {
            const parentMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            if (parentMetaData instanceof EntityMetaData && parentMetaData.allowInheritance)
                this.parentType = parentType;
        }
        if (!name)
            this.name = type.name!;
    }
}

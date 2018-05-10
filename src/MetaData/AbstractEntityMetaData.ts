import { ClassBase, GenericType, IObjectType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IndexMetaData, ComputedColumnMetaData } from "../MetaData";
import { InheritanceMetaData, RelationMetaData } from "../MetaData/Relation";
import { EntityMetaData } from "./EntityMetaData";
import { IEntityMetaData } from "./Interface";
import { IOrderMetaData } from "./Interface/IOrderMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";

export class AbstractEntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public defaultOrder?: IOrderMetaData[];
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deleteColumn?: IColumnMetaData<TE>;
    public relations: { [key: string]: RelationMetaData<TE, any> } = {};
    public createDateColumn?: IColumnMetaData<TE>;
    public modifiedDateColumn?: IColumnMetaData<TE>;
    public columns: IColumnMetaData<TE>[] = [];
    public indices: { [key: string]: IndexMetaData } = {};
    public computedProperties: ComputedColumnMetaData<TE>[] = [];

    // inheritance
    public parentType?: GenericType<TParent>;
    public allowInheritance = false;
    public inheritance: InheritanceMetaData<TParent>;
    public name: string;

    constructor(public type: IObjectType<TE>, name?: string, defaultOrder?: IOrderMetaData[]) {
        this.inheritance = new InheritanceMetaData(this);
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

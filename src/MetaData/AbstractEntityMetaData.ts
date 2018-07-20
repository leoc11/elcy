import { ClassBase, GenericType, IObjectType } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { EntityMetaData } from "./EntityMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IOrderMetaData } from "./Interface/IOrderMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { IndexMetaData } from "./IndexMetaData";
import { ComputedColumnMetaData } from "./ComputedColumnMetaData";
import { InheritanceMetaData } from "./Relation/InheritanceMetaData";

export class AbstractEntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public defaultOrder?: IOrderMetaData[];
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deleteColumn?: IColumnMetaData<TE>;
    public relations: IRelationMetaData<TE, any>[] = [];
    public createDateColumn?: IColumnMetaData<TE>;
    public modifiedDateColumn?: IColumnMetaData<TE>;
    public columns: IColumnMetaData<TE>[] = [];
    public indices: IndexMetaData<TE>[] = [];
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

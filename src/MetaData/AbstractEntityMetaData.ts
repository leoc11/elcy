import { ClassBase, GenericType, IObjectType, ColumnGeneration } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { EntityMetaData } from "./EntityMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IOrderMetaData } from "./Interface/IOrderMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { IndexMetaData } from "./IndexMetaData";
import { InheritanceMetaData } from "./Relation/InheritanceMetaData";
import { isNotNull } from "../Helper/Util";

export class AbstractEntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public defaultOrder?: IOrderMetaData[];
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deletedColumn?: IColumnMetaData<TE>;
    public relations: IRelationMetaData<TE, any>[] = [];
    public createDateColumn?: IColumnMetaData<TE>;
    public modifiedDateColumn?: IColumnMetaData<TE>;
    public columns: IColumnMetaData<TE>[] = [];
    public indices: IndexMetaData<TE>[] = [];

    // inheritance
    public parentType?: GenericType<TParent>;
    public allowInheritance = false;
    public inheritance: InheritanceMetaData<TParent>;
    public name: string;
    public get insertGeneratedColumns() {
        return this.columns.where(o => {
            return !isNotNull(o.default) || (o.generation & ColumnGeneration.Insert) as any;
        }).toArray();
    }
    public get updateGeneratedColumns() {
        return this.columns.where(o => {
            return (o.generation & ColumnGeneration.Update) as any;
        }).toArray();
    }

    constructor(public type: IObjectType<TE>, name?: string) {
        this.inheritance = new InheritanceMetaData(this);
        if (typeof name !== "undefined")
            this.name = name;
        if (!name)
            this.name = type.name;

        const parentType = Reflect.getPrototypeOf(this.type) as GenericType<TParent>;
        if (parentType !== ClassBase) {
            const parentMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, parentType);
            if (parentMetaData instanceof EntityMetaData && parentMetaData.allowInheritance)
                this.parentType = parentType;
        }
    }
}

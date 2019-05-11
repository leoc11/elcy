import { ClassBase, GenericType, IObjectType, ColumnGeneration } from "../Common/Type";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { EntityMetaData } from "./EntityMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IRelationMetaData } from "./Interface/IRelationMetaData";
import { IndexMetaData } from "./IndexMetaData";
import { InheritanceMetaData } from "./Relation/InheritanceMetaData";
import { isNotNull } from "../Helper/Util";
import { IConstraintMetaData } from "./Interface/IConstraintMetaData";
import { BooleanColumnMetaData } from "./BooleanColumnMetaData";
import { DateTimeColumnMetaData } from "./DateTimeColumnMetaData";
import { IOrderQueryDefinition } from "../Queryable/Interface/IOrderQueryDefinition";

export class AbstractEntityMetaData<TE extends TParent, TParent = any> implements IEntityMetaData<TE, TParent> {
    public defaultOrders?: IOrderQueryDefinition<TE>[];
    public primaryKeys: Array<IColumnMetaData<TE>> = [];
    public deletedColumn?: BooleanColumnMetaData<TE>;
    public relations: IRelationMetaData<TE, any>[] = [];
    public createDateColumn?: DateTimeColumnMetaData<TE>;
    public modifiedDateColumn?: DateTimeColumnMetaData<TE>;
    public columns: IColumnMetaData<TE>[] = [];
    public indices: IndexMetaData<TE>[] = [];
    public constraints: IConstraintMetaData<TE>[] = [];

    // inheritance
    public parentType?: GenericType<TParent>;
    public allowInheritance = false;
    public inheritance: InheritanceMetaData<TParent>;
    public name: string;
    public get insertGeneratedColumns() {
        return this.columns.where(o => {
            return !isNotNull(o.defaultExp) || (o.generation & ColumnGeneration.Insert) as any;
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

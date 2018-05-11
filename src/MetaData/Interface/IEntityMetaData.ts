import { IObjectType } from "../../Common/Type";
import { IndexMetaData, ComputedColumnMetaData } from "../../MetaData";
import { InheritanceMetaData, RelationMetaData } from "../Relation";
import { IOrderMetaData } from "./IOrderMetaData";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { IColumnMetaData } from "./IColumnMetaData";

export interface IEntityMetaData<TE extends TParent, TParent = any> extends IDBEventListener<TE> {
    name: string;
    schema?: string;
    defaultOrder?: IOrderMetaData[];
    primaryKeys: Array<IColumnMetaData<TE>>;
    deleteColumn?: IColumnMetaData<TE, boolean>;
    createDateColumn?: IColumnMetaData<TE, Date>;
    modifiedDateColumn?: IColumnMetaData<TE, Date>;
    columns: IColumnMetaData<TE>[];
    indices?: { [key: string]: IndexMetaData };
    computedProperties?: ComputedColumnMetaData<TE>[];
    type: IObjectType<TE>;
    descriminatorMember?: string;
    allowInheritance?: boolean;
    inheritance: InheritanceMetaData<TParent>;
    relations?: { [key: string]: RelationMetaData<TE, any> };
    priority?: number;
}

import { IObjectType } from "../../Common/Type";
import { ComputedColumnMetaData } from "../../MetaData";
import { InheritanceMetaData } from "../Relation";
import { IOrderMetaData } from "./IOrderMetaData";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { IColumnMetaData } from "./IColumnMetaData";
import { IConstraintMetaData } from "./IConstraintMetaData";
import { IRelationMetaData } from "./IRelationMetaData";
import { IIndexMetaData } from "./IIndexMetaData";

export interface IEntityMetaData<TE extends TParent = any, TParent = any> extends IDBEventListener<TE> {
    name: string;
    schema?: string;
    defaultOrder?: IOrderMetaData[];
    primaryKeys: Array<IColumnMetaData<TE>>;
    deleteColumn?: IColumnMetaData<TE, boolean>;
    createDateColumn?: IColumnMetaData<TE, Date>;
    modifiedDateColumn?: IColumnMetaData<TE, Date>;
    columns: IColumnMetaData<TE>[];
    indices?: IIndexMetaData<TE>[];
    constraints?: IConstraintMetaData<TE>[];
    computedProperties?: ComputedColumnMetaData<TE>[];
    type: IObjectType<TE>;
    descriminatorMember?: string;
    allowInheritance?: boolean;
    inheritance: InheritanceMetaData<TParent>;
    relations?: IRelationMetaData<TE, any>[];
    priority?: number;
}

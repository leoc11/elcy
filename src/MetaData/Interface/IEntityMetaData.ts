import { IObjectType, ConcurrencyModel } from "../../Common/Type";
import { InheritanceMetaData } from "../Relation/InheritanceMetaData";
import { IOrderMetaData } from "./IOrderMetaData";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { IColumnMetaData } from "./IColumnMetaData";
import { IConstraintMetaData } from "./IConstraintMetaData";
import { IRelationMetaData } from "./IRelationMetaData";
import { IIndexMetaData } from "./IIndexMetaData";
import { RowVersionColumnMetaData } from "../RowVersionColumnMetaData";

export interface IEntityMetaData<TE extends TParent = any, TParent = any> extends IDBEventListener<TE> {
    name: string;
    schema?: string;
    defaultOrder?: IOrderMetaData[];
    primaryKeys: Array<IColumnMetaData<TE>>;
    versionColumn?: RowVersionColumnMetaData<TE>;
    deletedColumn?: IColumnMetaData<TE, boolean>;
    createDateColumn?: IColumnMetaData<TE, Date>;
    modifiedDateColumn?: IColumnMetaData<TE, Date>;
    columns: IColumnMetaData<TE>[];
    indices?: IIndexMetaData<TE>[];
    constraints?: IConstraintMetaData<TE>[];
    type: IObjectType<TE>;
    descriminatorMember?: string;
    allowInheritance?: boolean;
    inheritance: InheritanceMetaData<TParent>;
    relations?: IRelationMetaData<TE, any>[];
    priority?: number;
    hasIncrementPrimary?: boolean;
    isReadOnly?: boolean;
    concurrencyMode?: ConcurrencyModel;

    insertGeneratedColumns?: IColumnMetaData<TE>[];
    updateGeneratedColumns?: IColumnMetaData<TE>[];
}

import { ConcurrencyModel, IObjectType } from "../../Common/Type";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { IOrderQueryDefinition } from "../../Queryable/Interface/IOrderQueryDefinition";
import { BooleanColumnMetaData } from "../BooleanColumnMetaData";
import { DateTimeColumnMetaData } from "../DateTimeColumnMetaData";
import { EmbeddedRelationMetaData } from "../EmbeddedColumnMetaData";
import { InheritanceMetaData } from "../Relation/InheritanceMetaData";
import { RowVersionColumnMetaData } from "../RowVersionColumnMetaData";
import { IColumnMetaData } from "./IColumnMetaData";
import { IConstraintMetaData } from "./IConstraintMetaData";
import { IIndexMetaData } from "./IIndexMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IEntityMetaData<TE extends TParent = any, TParent = any> extends IDBEventListener<TE> {
    name: string;
    schema?: string;
    defaultOrders?: Array<IOrderQueryDefinition<TE>>;
    primaryKeys: Array<IColumnMetaData<TE>>;
    versionColumn?: RowVersionColumnMetaData<TE>;
    deletedColumn?: BooleanColumnMetaData<TE>;
    createDateColumn?: DateTimeColumnMetaData<TE>;
    modifiedDateColumn?: DateTimeColumnMetaData<TE>;
    columns: Array<IColumnMetaData<TE>>;
    indices?: Array<IIndexMetaData<TE>>;
    constraints?: Array<IConstraintMetaData<TE>>;
    type: IObjectType<TE>;
    descriminatorMember?: string;
    allowInheritance?: boolean;
    inheritance: InheritanceMetaData<TParent>;
    relations?: Array<IRelationMetaData<TE>>;
    embeds?: Array<EmbeddedRelationMetaData<TE>>;
    priority?: number;
    hasIncrementPrimary?: boolean;
    isReadOnly?: boolean;
    concurrencyMode?: ConcurrencyModel;

    insertGeneratedColumns?: Array<IColumnMetaData<TE>>;
    updateGeneratedColumns?: Array<IColumnMetaData<TE>>;
}

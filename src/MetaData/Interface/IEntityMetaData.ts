import { IObjectType, ConcurrencyModel } from "../../Common/Type";
import { ComputedColumnMetaData } from "../ComputedColumnMetaData";
import { InheritanceMetaData } from "../Relation/InheritanceMetaData";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { IColumnMetaData } from "./IColumnMetaData";
import { IConstraintMetaData } from "./IConstraintMetaData";
import { IRelationMetaData } from "./IRelationMetaData";
import { IIndexMetaData } from "./IIndexMetaData";
import { RowVersionColumnMetaData } from "../RowVersionColumnMetaData";
import { DateTimeColumnMetaData } from "../DateTimeColumnMetaData";
import { BooleanColumnMetaData } from "../BooleanColumnMetaData";
import { IOrderQueryDefinition } from "../../Queryable/Interface/IOrderQueryDefinition";
import { EmbeddedRelationMetaData } from "../EmbeddedColumnMetaData";

export interface IEntityMetaData<TE extends TParent = any, TParent = any> extends IDBEventListener<TE> {
    name: string;
    schema?: string;
    defaultOrders?: IOrderQueryDefinition<TE>[];
    primaryKeys: Array<IColumnMetaData<TE>>;
    versionColumn?: RowVersionColumnMetaData<TE>;
    deletedColumn?: BooleanColumnMetaData<TE>;
    createDateColumn?: DateTimeColumnMetaData<TE>;
    modifiedDateColumn?: DateTimeColumnMetaData<TE>;
    columns: IColumnMetaData<TE>[];
    indices?: IIndexMetaData<TE>[];
    constraints?: IConstraintMetaData<TE>[];
    computedProperties?: ComputedColumnMetaData<TE>[];
    type: IObjectType<TE>;
    descriminatorMember?: string;
    allowInheritance?: boolean;
    inheritance: InheritanceMetaData<TParent>;
    relations?: IRelationMetaData<TE>[];
    embeds?: EmbeddedRelationMetaData<TE>[];
    priority?: number;
    hasIncrementPrimary?: boolean;
    isReadOnly?: boolean;
    concurrencyMode?: ConcurrencyModel;

    insertGeneratedColumns?: IColumnMetaData<TE>[];
    updateGeneratedColumns?: IColumnMetaData<TE>[];
}

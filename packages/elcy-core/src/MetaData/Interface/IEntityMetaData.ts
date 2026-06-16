import { ConcurrencyModel, OrderDirection } from "../../Common/StringType";
import { IObjectType, ValueType } from "../../Common/Type";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { BooleanColumnMetaData } from "../BooleanColumnMetaData";
import { DateTimeColumnMetaData } from "../DateTimeColumnMetaData";
import { EmbeddedRelationMetaData } from "../EmbeddedColumnMetaData";
import { InheritanceMetaData } from "../Relation/InheritanceMetaData";
import { RowVersionColumnMetaData } from "../RowVersionColumnMetaData";
import { IColumnMetaData } from "./IColumnMetaData";
import { IConstraintMetaData } from "./IConstraintMetaData";
import { IIndexMetaData } from "./IIndexMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IEntityMetaData<TE extends object = any, TBase extends object = object> extends IDBEventListener<TE> {
    allowInheritance?: boolean;
    columns: Array<IColumnMetaData<TE>>;
    concurrencyMode?: ConcurrencyModel;
    constraints?: Array<IConstraintMetaData<TE>>;
    createDateColumn?: DateTimeColumnMetaData<TE>;
    defaultOrders?: Array<ArrayValueExpression<((...param: TE[]) => ValueType) | OrderDirection>>;
    deletedColumn?: BooleanColumnMetaData<TE>;
    descriminatorMember?: string;
    embeds?: Array<EmbeddedRelationMetaData<TE>>;
    hasGeneratedPrimary?: boolean;
    indices?: Array<IIndexMetaData<TE>>;
    inheritance?: InheritanceMetaData<TBase>;

    insertGeneratedColumns?: Array<IColumnMetaData<TE>>;
    isReadOnly?: boolean;
    modifiedDateColumn?: DateTimeColumnMetaData<TE>;
    name: string;
    primaryKeys: Array<IColumnMetaData<TE>>;
    relations?: Array<IRelationMetaData<TE>>;
    schema?: string;
    type: IObjectType<TE>;
    updateGeneratedColumns?: Array<IColumnMetaData<TE>>;
    versionColumn?: RowVersionColumnMetaData<TE>;
}

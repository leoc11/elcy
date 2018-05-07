import { GenericType } from "../../Common/Type";
import { IndexMetaData } from "../../MetaData";
import { InheritanceMetaData, RelationMetaData } from "../Relation";
import { IOrderCondition } from "./IOrderCondition";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";
import { IColumnMetaData } from "./IColumnMetaData";

export interface IEntityMetaData<TE extends TParent, TParent = any> extends IDBEventListener<TE> {
    name: string;
    defaultOrder?: IOrderCondition[];
    primaryKeys: Array<IColumnMetaData<TE>>;
    deleteColumn?: IColumnMetaData<TE, boolean>;
    createDateColumn?: IColumnMetaData<TE, Date>;
    modifiedDateColumn?: IColumnMetaData<TE, Date>;
    properties: IColumnMetaData<TE>[];
    indices: { [key: string]: IndexMetaData };
    computedProperties: string[];
    type: GenericType<TE>;
    descriminatorMember?: string;
    allowInheritance: boolean;
    inheritance: InheritanceMetaData<TParent>;
    relations: { [key: string]: RelationMetaData<TE, any> };
}

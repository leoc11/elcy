import { GenericType } from "../../Common/Type";
import { IndexMetaData } from "../../MetaData";
import { ForeignKeyMetaData, InheritanceMetaData } from "../Relation";
import { IOrderCondition } from "./IOrderCondition";

export interface IEntityMetaData<T extends TParent, TParent = any> {
    defaultOrder?: IOrderCondition[];
    primaryKeys: string[];
    deleteProperty?: string;
    createDateProperty?: string;
    modifiedDateProperty?: string;
    properties: string[];
    foreignKeys: { [key: string]: ForeignKeyMetaData<T, any> };
    indices: { [key: string]: IndexMetaData };
    computedProperties: string[];
    type: GenericType<T>;
    descriminatorMember?: string;
    allowInheritance: boolean;
    inheritance: InheritanceMetaData<TParent>;
}

import { GenericType } from "../../Common/Type";
import { IndexMetaData } from "../../MetaData";
import { InheritanceMetaData, RelationMetaData } from "../Relation";
import { IOrderCondition } from "./IOrderCondition";
import { IDBEventListener } from "../../Data/Event/IDBEventListener";

export interface IEntityMetaData<T extends TParent, TParent = any> extends IDBEventListener<T> {
    defaultOrder?: IOrderCondition[];
    primaryKeys: Array<keyof T>;
    deleteProperty?: string;
    createDateProperty?: string;
    modifiedDateProperty?: string;
    properties: string[];
    indices: { [key: string]: IndexMetaData };
    computedProperties: string[];
    type: GenericType<T>;
    descriminatorMember?: string;
    allowInheritance: boolean;
    inheritance: InheritanceMetaData<TParent>;
    relations: { [key: string]: RelationMetaData<T, any> };
}

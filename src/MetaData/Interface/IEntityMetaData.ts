import { UniqueMetaData } from "../../MetaData";
import { ForeignKeyMetaData, InheritanceMetaData } from "../Relation";
import { genericType } from "../Types";

export interface IEntityMetaData<T extends TParent, TParent = any> {
    defaultOrder?: (item: T) => any;
    primaryKeys: string[];
    deleteProperty?: string;
    createDateProperty?: string;
    modifiedDateProperty?: string;
    properties: string[];
    foreignKeys: { [key: string]: ForeignKeyMetaData<T, any> };
    uniques: { [key: string]: UniqueMetaData };
    computedProperties: string[];
    type: genericType<T>;
    descriminatorMember?: string;
    allowInheritance: boolean;
    inheritance: InheritanceMetaData<TParent>;
}

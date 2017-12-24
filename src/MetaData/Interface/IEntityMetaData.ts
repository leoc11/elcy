import { genericType } from "../../Common/Type";
import { IndexMetaData } from "../../MetaData";
import { ForeignKeyMetaData, InheritanceMetaData } from "../Relation";
import { ClassEventListener } from "../../Common/ClassEventListener";
import { ISaveEventParam } from "./ISaveEventParam";
import { IDeleteEventParam } from "./IDeleteEventParam";

export interface IEntityMetaData<T extends TParent, TParent = any> {
    defaultOrder?: (item: T) => any;
    primaryKeys: string[];
    deleteProperty?: string;
    createDateProperty?: string;
    modifiedDateProperty?: string;
    properties: string[];
    foreignKeys: { [key: string]: ForeignKeyMetaData<T, any> };
    indices: { [key: string]: IndexMetaData };
    computedProperties: string[];
    type: genericType<T>;
    descriminatorMember?: string;
    allowInheritance: boolean;
    inheritance: InheritanceMetaData<TParent>;

    // -------------------------------------------------------------------------
    // Event Listener
    // -------------------------------------------------------------------------

    beforeSave: ClassEventListener<T, ISaveEventParam, boolean>;
    beforeDelete: ClassEventListener<T, IDeleteEventParam, boolean>;
    afterLoad: ClassEventListener<T, void, void>;
    afterSave: ClassEventListener<T, ISaveEventParam, void>;
    afterDelete: ClassEventListener<T, IDeleteEventParam, void>;
}

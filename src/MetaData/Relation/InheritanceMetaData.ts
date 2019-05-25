import { InheritanceType } from "../../Common/Type";
import { IEntityMetaData } from "../Interface/IEntityMetaData";

export class InheritanceMetaData<TE = any, TParent = any> {
    constructor(public child: IEntityMetaData<TE>) { }
    public inheritanceType?: InheritanceType;
    /**
     * parent will always point to first concrete ancestor
     */
    public parent: IEntityMetaData<TParent>;
}

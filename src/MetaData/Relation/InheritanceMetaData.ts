import { InheritanceType } from "../../Common/Type";
import { IEntityMetaData } from "../Interface";

export class InheritanceMetaData<TE = any, TParent = any> {
    constructor(public child: IEntityMetaData<TE>) { }
    /**
     * parent will always point to first concrete ancestor
     */
    public parent: IEntityMetaData<TParent>;
    public inheritanceType?: InheritanceType;
}

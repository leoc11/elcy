import { InheritanceType } from "../../Common/Type";
import { IEntityMetaData } from "../Interface/IEntityMetaData";

export class InheritanceMetaData<TBase = any> {
    public inheritanceType?: InheritanceType;
    /**
     * parent will always point to first concrete ancestor
     */
    public parent: IEntityMetaData<TBase>;
}

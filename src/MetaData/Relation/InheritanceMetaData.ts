import { InheritanceType } from "../../Common/Enum";
import { IEntityMetaData } from "../Interface/IEntityMetaData";

export class InheritanceMetaData<TBase = unknown> {
    public inheritanceType?: InheritanceType;
    /**
     * parent will always point to first concrete ancestor
     */
    public parent: IEntityMetaData<TBase>;
}

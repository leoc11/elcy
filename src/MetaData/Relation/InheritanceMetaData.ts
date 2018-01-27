import { GenericType, InheritanceType } from "../../Common/Type";

export class InheritanceMetaData<TParent> {
    /**
     * parentType will always point to first concrete ancestor
     */
    public parentType?: GenericType<TParent>;
    public inheritanceType?: InheritanceType;
}

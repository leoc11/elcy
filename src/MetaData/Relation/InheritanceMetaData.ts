import { genericType, InheritanceType } from "../Types";

export class InheritanceMetaData<TParent> {
    /**
     * parentType will always point to first concrete ancestor
     */
    public parentType?: genericType<TParent>;
    public inheritanceType?: InheritanceType;
}

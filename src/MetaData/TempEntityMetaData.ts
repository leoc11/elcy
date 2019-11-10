import { EntityMetaData } from "./EntityMetaData";

export class TempEntityMetaData<TE extends TBase, TBase = any> extends EntityMetaData<TE, TBase> {
    public schema: string = "";
}

import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IIndexMetaData } from "./Interface/IIndexMetaData";

export class IndexMetaData<TE extends object = object> implements IIndexMetaData<TE> {
    constructor(public readonly entity: IEntityMetaData<TE>, public name: string, public keys: Array<IColumnMetaData<TE>>, includes?: Array<IColumnMetaData<TE>>, unique?: boolean) {
        this.includes = includes || [];
        this.unique = unique || false;
    }
    public includes?: Array<IColumnMetaData<TE>>;
    public unique = false;
    /**
     * Apply index option
     */
    public apply(indexOption: IIndexMetaData<TE>) {
        if (typeof indexOption.name !== "undefined") {
            this.name = indexOption.name;
        }
        if (Array.isArray(indexOption.keys)) {
            this.keys = indexOption.keys;
        }
        if (Array.isArray(indexOption.includes)) {
            this.includes = indexOption.includes;
        }
        if (typeof indexOption.unique !== "undefined") {
            this.unique = indexOption.unique;
        }
    }
}

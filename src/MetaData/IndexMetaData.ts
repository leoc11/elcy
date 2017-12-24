import { IIndexOption } from "../Decorator/Option/IIndexOption";

export class IndexMetaData {
    public properties: string[] = [];
    public unique = false;
    constructor(public name: string, ...members: string[]) {
        this.properties = members;
    }
    /**
     * Apply index option
     */
    public Apply(indexOption: IIndexOption) {
        if (typeof indexOption.name !== "undefined")
            this.name = indexOption.name;
        if (typeof indexOption.properties !== "undefined")
            this.properties = indexOption.properties;
        if (typeof indexOption.unique !== "undefined")
            this.unique = indexOption.unique;
    }
}

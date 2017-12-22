import { genericType, ReferenceOption } from "./Types";

export class ForeignKeyMetaData<S, T> {
    public updateOption = ReferenceOption.NOACTION;
    public deleteOption = ReferenceOption.NOACTION;
    constructor(public name: string, public masterType: genericType<T>, public relationMaps: {[key in keyof S]: keyof T }, updateOption?: ReferenceOption, deleteOption?: ReferenceOption) {
        if (typeof updateOption !== "undefined")
            this.updateOption = updateOption;
        if (typeof deleteOption !== "undefined")
            this.deleteOption = deleteOption;
    }
}

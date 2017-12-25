import { genericType, ReferenceOption } from "../../Common/Type";

export class ForeignKeyMetaData<S, T> {
    public updateOption = ReferenceOption.NO_ACTION;
    public deleteOption = ReferenceOption.NO_ACTION;
    constructor(public name: string, public masterType: genericType<T>, public relationMaps: {[key in keyof S]?: keyof T }, updateOption?: ReferenceOption, deleteOption?: ReferenceOption) {
        if (typeof updateOption !== "undefined")
            this.updateOption = updateOption;
        if (typeof deleteOption !== "undefined")
            this.deleteOption = deleteOption;
    }
}

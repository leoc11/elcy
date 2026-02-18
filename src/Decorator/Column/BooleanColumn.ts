import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function BooleanColumn<TE extends object, T extends boolean>(option?: IBooleanColumnOption): ClassPropertyDecorator<TE, boolean>;
export function BooleanColumn<TE extends object, T extends boolean>(optionOrName?: IBooleanColumnOption | string, defaultValue?: () => boolean): ClassPropertyDecorator<TE, T> {
    let option: IBooleanColumnOption;
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        option = {};
        if (typeof optionOrName !== "undefined") {
            option.columnName = optionOrName as string;
        }
        if (typeof defaultValue !== "undefined") {
            option.default = defaultValue;
        }
    }
    return Column<TE, T>(BooleanColumnMetaData<TE> as any, option);
}

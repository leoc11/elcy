import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function BooleanColumn<TE extends object>(option?: IBooleanColumnOption): ClassPropertyDecorator<TE, boolean>;
export function BooleanColumn<TE extends object>(optionOrName?: IBooleanColumnOption | string, defaultValue?: () => boolean): ClassPropertyDecorator<TE, boolean> {
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
    return Column<TE, boolean>(Boolean, BooleanColumnMetaData<TE>, option);
}

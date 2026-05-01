import { StringColumnMetaData } from "../../MetaData/StringColumnMetaData";
import { IStringColumnOption } from "../Option/IStringColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function StringColumn<TE extends object, T extends string>(option?: IStringColumnOption): ClassPropertyDecorator<TE, string>;
export function StringColumn<TE extends object, T extends string>(name: string, defaultValue: () => T): ClassPropertyDecorator<TE, string>;
export function StringColumn<TE extends object, T extends string>(optionOrName?: IStringColumnOption | string, defaultValue?: () => T): ClassPropertyDecorator<TE, string> {
    let option: IStringColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined") {
            option.columnName = optionOrName as string;
        }
        if (typeof defaultValue !== "undefined") {
            option.default = defaultValue;
        }
    }
    return Column<TE, string>(String, StringColumnMetaData, option);
}

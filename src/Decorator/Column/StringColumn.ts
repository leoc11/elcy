import { StringColumnMetaData } from "../../MetaData/StringColumnMetaData";
import { IStringColumnOption } from "../Option/IStringColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function StringColumn<TE extends object, T extends string>(option?: IStringColumnOption): ClassPropertyDecorator<TE, T>;
export function StringColumn<TE extends object, T extends string>(optionOrName?: IStringColumnOption | string, defaultValue?: () => string): ClassPropertyDecorator<TE, T> {
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
    return Column<TE, T>(StringColumnMetaData as any, option);
}

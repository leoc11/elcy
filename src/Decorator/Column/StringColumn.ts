import { StringColumnMetaData } from "../../MetaData/StringColumnMetaData";
import { IStringColumnOption } from "../Option/IStringColumnOption";
import { Column } from "./Column";

export function StringColumn(option?: IStringColumnOption): PropertyDecorator & MethodDecorator;
export function StringColumn(optionOrName?: IStringColumnOption | string, defaultValue?: () => string): PropertyDecorator & MethodDecorator {
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
    return Column<any, any, string>(StringColumnMetaData, option);
}

import "reflect-metadata";
import { StringColumnMetaData } from "../../MetaData";
import { IStringColumnOption } from "../Option";
import { Column } from "./Column";

export function StringColumn(option?: IStringColumnOption): PropertyDecorator;
export function StringColumn(optionOrName?: IStringColumnOption | string, defaultValue?: () => string): PropertyDecorator {
    let option: IStringColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, string>(StringColumnMetaData, option);
}

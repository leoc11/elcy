import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData";
import { IBooleanColumnOption } from "../Option";
import { Column } from "./Column";

export function BooleanColumn(option: IBooleanColumnOption): PropertyDecorator;
export function BooleanColumn(optionOrName: IBooleanColumnOption | string, defaultValue?: boolean): PropertyDecorator {
    let option: IBooleanColumnOption;
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        option = {};
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, boolean>(BooleanColumnMetaData, option);
}

import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { Column } from "./Column";

export function BooleanColumn(option?: IBooleanColumnOption): PropertyDecorator & MethodDecorator;
export function BooleanColumn(optionOrName?: IBooleanColumnOption | string, defaultValue?: () => boolean): PropertyDecorator & MethodDecorator {
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
    return Column<any, any, boolean>(BooleanColumnMetaData, option);
}

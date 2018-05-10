import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData";
import { Column } from "./Column";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
// TODO: casecade soft delete.
export function DeleteColumn(option: IBooleanColumnOption): PropertyDecorator;
export function DeleteColumn(name?: string, defaultValue?: boolean): PropertyDecorator;
export function DeleteColumn(optionOrName?: IBooleanColumnOption | string, defaultValue?: boolean): PropertyDecorator {
    let option: IBooleanColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (defaultValue !== undefined) option.default = defaultValue;
    }
    else if (optionOrName) option = optionOrName;

    option.isDeleteColumn = true;
    return Column<any, boolean>(BooleanColumnMetaData, { isDeleteColumn: true });
}

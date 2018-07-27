import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { Column } from "./Column";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
// TODO: casecade soft delete.
export function DeletedColumn(option: IBooleanColumnOption): PropertyDecorator;
export function DeletedColumn(name?: string): PropertyDecorator;
export function DeletedColumn(optionOrName?: IBooleanColumnOption | string): PropertyDecorator {
    let option: IBooleanColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
    }
    else if (optionOrName) option = optionOrName;

    option.isDeletedColumn = true;
    option.isReadOnly = true;
    option.default = () => false;
    return Column<any, boolean>(BooleanColumnMetaData, option);
}

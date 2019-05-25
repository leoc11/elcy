import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { Column } from "./Column";
// TODO: casecade soft delete.
export function DeletedColumn(option: IBooleanColumnOption): PropertyDecorator;
export function DeletedColumn(name?: string): PropertyDecorator;
export function DeletedColumn(optionOrName?: IBooleanColumnOption | string): PropertyDecorator {
    let option: IBooleanColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
    }
    else if (optionOrName) {
        option = optionOrName;
    }

    option.isDeletedColumn = true;
    /* istanbul ignore next */
    option.default = () => false;
    return Column<any, boolean>(BooleanColumnMetaData, option);
}

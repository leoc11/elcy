import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData";
import { Column } from "./Column";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
// TODO: casecade soft delete.
export function DeleteColumn(option: IBooleanColumnOption): PropertyDecorator;
export function DeleteColumn(name?: string, defaultValue?: boolean): PropertyDecorator;
export function DeleteColumn(name?: string | IBooleanColumnOption, defaultValue?: boolean): PropertyDecorator {
    const metadata = new BooleanColumnMetaData();
    if (typeof name === "string") {
        metadata.columnName = name;
        if (defaultValue !== undefined) metadata.default = defaultValue;
    }
    else if (name) metadata.applyOption(name);

    return Column(metadata, { isDeleteColumn: true });
}

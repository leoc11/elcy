import "reflect-metadata";
import { NumericColumnMetaData } from "../../MetaData";
import { INumericColumnOption } from "../Option";
import { Column } from "./Column";

export function NumberColumn(option?: INumericColumnOption): PropertyDecorator;
export function NumberColumn(name?: string, defaultValue?: () => number): PropertyDecorator;
export function NumberColumn(optionOrName?: string | INumericColumnOption, defaultValue?: () => number): PropertyDecorator {
    let option: INumericColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, number>(NumericColumnMetaData, option);
}

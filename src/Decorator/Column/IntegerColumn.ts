import "reflect-metadata";
import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { INumericColumnOption } from "../Option/INumericColumnOption";
import { Column } from "./Column";

export function IntegerColumn(option?: INumericColumnOption): PropertyDecorator;
export function IntegerColumn(name?: string, defaultValue?: () => number): PropertyDecorator;
export function IntegerColumn(optionOrName?: string | INumericColumnOption, defaultValue?: () => number): PropertyDecorator {
    let option: INumericColumnOption = {};
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

    return Column<any, number>(IntegerColumnMetaData, option);
}

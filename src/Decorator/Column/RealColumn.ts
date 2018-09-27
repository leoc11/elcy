import "reflect-metadata";
import { Column } from "./Column";
import { IRealColumnOption } from "../Option/IRealColumnOption";
import { RealColumnMetaData } from "../../MetaData/RealColumnMetaData";

export function RealColumn(option?: IRealColumnOption): PropertyDecorator;
export function RealColumn(name?: string, defaultValue?: () => number): PropertyDecorator;
export function RealColumn(optionOrName?: string | IRealColumnOption, defaultValue?: () => number): PropertyDecorator {
    let option: IRealColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, number>(RealColumnMetaData, option);
}

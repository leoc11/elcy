import "reflect-metadata";
import { RealColumnMetaData } from "../../MetaData/RealColumnMetaData";
import { IRealColumnOption } from "../Option/IRealColumnOption";
import { Column } from "./Column";

export function RealColumn(option?: IRealColumnOption): PropertyDecorator;
export function RealColumn(name?: string, defaultValue?: () => number): PropertyDecorator;
export function RealColumn(optionOrName?: string | IRealColumnOption, defaultValue?: () => number): PropertyDecorator {
    let option: IRealColumnOption = {};
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
    return Column<any, number>(RealColumnMetaData, option);
}

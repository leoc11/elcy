import { RealColumnMetaData } from "../../MetaData/RealColumnMetaData";
import { IRealColumnOption } from "../Option/IRealColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function RealColumn<TE extends object>(option?: IRealColumnOption): ClassPropertyDecorator<TE, number>;
export function RealColumn<TE extends object>(name?: string, defaultValue?: () => number): ClassPropertyDecorator<TE, number>;
export function RealColumn<TE extends object>(optionOrName?: string | IRealColumnOption, defaultValue?: () => number): ClassPropertyDecorator<TE, number> {
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
    return Column<TE, number>(Number, RealColumnMetaData, option);
}

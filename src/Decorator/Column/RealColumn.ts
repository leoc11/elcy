import { RealColumnMetaData } from "../../MetaData/RealColumnMetaData";
import { IRealColumnOption } from "../Option/IRealColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function RealColumn<TE extends object, T extends number>(option?: IRealColumnOption): ClassPropertyDecorator<TE, T>;
export function RealColumn<TE extends object, T extends number>(name?: string, defaultValue?: () => number): ClassPropertyDecorator<TE, T>;
export function RealColumn<TE extends object, T extends number>(optionOrName?: string | IRealColumnOption, defaultValue?: () => number): ClassPropertyDecorator<TE, T> {
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
    return Column<TE, T>(RealColumnMetaData as any, option);
}

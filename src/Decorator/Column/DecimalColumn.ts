import "reflect-metadata";
import { DecimalColumnMetaData } from "../../MetaData";
import { IDecimalColumnOption } from "../Option";
import { Column } from "./Column";

export function DecimalColumn(option?: IDecimalColumnOption): PropertyDecorator;
export function DecimalColumn(optionOrName?: string | IDecimalColumnOption, defaultValue?: () => number): PropertyDecorator {
    let option: IDecimalColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, number>(DecimalColumnMetaData, option);
}

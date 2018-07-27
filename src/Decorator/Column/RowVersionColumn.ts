import "reflect-metadata";
import { Column } from "./Column";
import { IRowVersionColumnOption } from "../Option/IRowVersionColumnOption";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { ColumnGeneration } from "../../Common/Type";

export function RowVersionColumn(option?: IRowVersionColumnOption): PropertyDecorator;
export function RowVersionColumn(optionOrName?: IRowVersionColumnOption | string, defaultValue?: () => string): PropertyDecorator {
    let option: IRowVersionColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column(RowVersionColumnMetaData, option);
}

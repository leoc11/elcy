import "reflect-metadata";
import { Column } from "./Column";
import { IApproximateNumberColumnOption } from "../Option/IApproximateNumberColumnOption";
import { ApproximateNumberColumnMetaData } from "../../MetaData/ApproximateNumberColumnMetaData";

export function ApproximateNumberColumn(option?: IApproximateNumberColumnOption): PropertyDecorator;
export function ApproximateNumberColumn(name?: string, defaultValue?: () => number): PropertyDecorator;
export function ApproximateNumberColumn(optionOrName?: string | IApproximateNumberColumnOption, defaultValue?: () => number): PropertyDecorator {
    let option: IApproximateNumberColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, number>(ApproximateNumberColumnMetaData, option);
}

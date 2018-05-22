import "reflect-metadata";
import { Column } from "./Column";
import { IApproximateNumericColumnOption } from "../Option/IApproximateNumericColumnOption";
import { ApproximateColumnMetaData } from "../../MetaData/ApproximateColumnMetaData";

export function ApproximateNumberColumn(option?: IApproximateNumericColumnOption): PropertyDecorator;
export function ApproximateNumberColumn(name?: string, defaultValue?: () => number): PropertyDecorator;
export function ApproximateNumberColumn(optionOrName?: string | IApproximateNumericColumnOption, defaultValue?: () => number): PropertyDecorator {
    let option: IApproximateNumericColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, number>(ApproximateColumnMetaData, option);
}

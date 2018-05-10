import "reflect-metadata";
import { Column } from "./Column";
import { ITimestampColumnOption } from "../Option/ITimestampColumnOption";
import { TimestampColumnMetaData } from "../../MetaData/TimestampColumnMetaData";

export function TimestampColumn(option?: ITimestampColumnOption): PropertyDecorator;
export function TimestampColumn(optionOrName?: ITimestampColumnOption | string, defaultValue?: string): PropertyDecorator {
    let option: ITimestampColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined")
            option.columnName = optionOrName as string;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column(TimestampColumnMetaData, option);
}

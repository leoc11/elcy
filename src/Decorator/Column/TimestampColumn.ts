import "reflect-metadata";
import { Column } from "./Column";
import { ITimestampColumnOption } from "../Option/ITimestampColumnOption";
import { TimestampColumnMetaData } from "../../MetaData/TimestampColumnMetaData";

export function TimestampColumn(option?: ITimestampColumnOption): PropertyDecorator;
export function TimestampColumn(name?: string | ITimestampColumnOption, defaultValue?: string): PropertyDecorator {
    const metadata = new TimestampColumnMetaData();
    if (name && typeof name !== "string") {
        metadata.applyOption(name);
    }
    else {
        if (typeof name !== "undefined")
            metadata.columnName = name as string;
        if (typeof defaultValue !== "undefined")
            metadata.default = defaultValue;
    }
    return Column(metadata);
}

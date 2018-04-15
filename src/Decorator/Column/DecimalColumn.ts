import "reflect-metadata";
import { DecimalColumnMetaData } from "../../MetaData";
import { IDecimalColumnOption } from "../Option";
import { Column } from "./Column";

export function DecimalColumn(option?: IDecimalColumnOption): PropertyDecorator;
export function DecimalColumn(name?: string | IDecimalColumnOption, defaultValue?: number): PropertyDecorator {
    const metadata = new DecimalColumnMetaData();
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

import "reflect-metadata";
import { NumericColumnMetaData } from "../../MetaData";
import { INumericColumnOption } from "../Option";
import { Column } from "./Column";

export function NumberColumn(option: INumericColumnOption): PropertyDecorator;
// tslint:disable-next-line:ban-types
export function NumberColumn(name?: string | INumericColumnOption, defaultValue?: number): PropertyDecorator {
    const metadata = new NumericColumnMetaData();
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

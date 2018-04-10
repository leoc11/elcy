import "reflect-metadata";
import { StringColumnMetaData } from "../../MetaData";
import { IStringColumnOption } from "../Option";
import { Column } from "./Column";

export function StringColumn(option: IStringColumnOption): PropertyDecorator;
// tslint:disable-next-line:ban-types
export function StringColumn(name?: string | IStringColumnOption, defaultValue?: string): PropertyDecorator {
    const metadata = new StringColumnMetaData();
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

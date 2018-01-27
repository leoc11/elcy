import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData";
import { IBooleanColumnOption } from "../Option";
import { Column } from "./Column";

export function BooleanColumn(option: IBooleanColumnOption): PropertyDecorator;
// tslint:disable-next-line:ban-types
export function BooleanColumn(name?: string | IBooleanColumnOption, defaultValue?: boolean): PropertyDecorator {
    const metadata = new BooleanColumnMetaData();
    if (name && typeof name !== "string") {
        metadata.applyOption(name);
    }
    else {
        if (typeof name !== "undefined")
            metadata.name = name as string;
        if (typeof defaultValue !== "undefined")
            metadata.default = defaultValue;
    }
    return Column(metadata);
}

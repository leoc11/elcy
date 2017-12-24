import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData";
import { IBooleanColumnOption } from "../Option";
import { Column } from "./Column";

export function BooleanColumn(option: IBooleanColumnOption): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
// tslint:disable-next-line:ban-types
export function BooleanColumn(name?: string | IBooleanColumnOption, defaultValue?: boolean): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new BooleanColumnMetaData();
    if (name && typeof name !== "string") {
        metadata.ApplyOption(name);
    }
    else {
        if (typeof name !== "undefined")
            metadata.name = name as string;
        if (typeof defaultValue !== "undefined")
            metadata.default = defaultValue;
    }
    return Column(metadata);
}

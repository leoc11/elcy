import "reflect-metadata";
import { StringColumnMetaData } from "../../MetaData";
import { IStringColumnOption } from "../Option";
import { Column } from "./Column";

export function StringColumn(option: IStringColumnOption): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
// tslint:disable-next-line:ban-types
export function StringColumn(name?: string | IStringColumnOption, defaultValue?: string): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new StringColumnMetaData();
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

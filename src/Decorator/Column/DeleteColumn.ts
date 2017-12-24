import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData";
import { Column } from "./Column";

export function DeleteColumn(name?: string, defaultValue?: boolean): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new BooleanColumnMetaData();
    if (typeof name !== "undefined")
        metadata.name = name;
    if (typeof defaultValue !== "undefined")
        metadata.default = defaultValue;

    return Column(metadata, { isDeleteColumn: true });
}

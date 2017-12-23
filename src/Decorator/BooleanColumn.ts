import "reflect-metadata";
import { BooleanColumnMetaData } from "../MetaData";
import { IBooleanColumnMetaData } from "../MetaData/Interface";
import { Column } from "./Column";

export function BooleanColumn(option: IBooleanColumnMetaData): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
// tslint:disable-next-line:ban-types
export function BooleanColumn(name?: string | IBooleanColumnMetaData, defaultValue?: boolean): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new BooleanColumnMetaData();
    if (name instanceof BooleanColumnMetaData) {
        metadata.Copy(name);
    }
    else {
        if (typeof name !== "undefined")
            metadata.name = name as string;
        if (typeof defaultValue !== "undefined")
            metadata.default = defaultValue;
    }
    return Column(metadata);
}

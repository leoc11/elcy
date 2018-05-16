import { IObjectType } from "../Common/Type";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { AbstractEntityMetaData } from ".";

export class EmbeddedColumnMetaData<TE, T> implements IColumnMetaData<TE, T> {
    public get type(): IObjectType<T> {
        return this.embeddedEntity.type;
    }
    public prefix?: string;
    constructor(public embeddedEntity: AbstractEntityMetaData<T>, public propertyName: keyof TE, prefix?: string) {
        this.prefix = prefix || this.propertyName;
    }
}

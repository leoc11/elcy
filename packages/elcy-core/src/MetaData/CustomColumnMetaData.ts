import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class CustomColumnMetaData<TE extends object, T = unknown> extends ColumnMetaData<TE, T> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<T>) {
        super(entityMeta, type);
    }
}

import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from ".";

export interface IIndexMetaData<TE = any> {
    name: string;
    entity: IEntityMetaData<TE>;
    columns: Array<IColumnMetaData<TE>>;
    unique: boolean;
    type?: string;
    apply?(indexOption: IIndexMetaData): void;
}

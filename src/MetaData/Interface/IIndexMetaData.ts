import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IIndexMetaData<TE = any> {
    columns: Array<IColumnMetaData<TE>>;
    entity: IEntityMetaData<TE>;
    name: string;
    unique: boolean;
    // type?: string;
    apply?(indexOption: IIndexMetaData): void;
}

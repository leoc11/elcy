import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IIndexMetaData<TE extends object = object> {
    keys: Array<IColumnMetaData<TE>>;
    includes?: Array<IColumnMetaData<TE>>;
    entity: IEntityMetaData<TE>;
    name: string;
    unique: boolean;
    // type?: string;
    apply?(indexOption: IIndexMetaData<TE>): void;
}

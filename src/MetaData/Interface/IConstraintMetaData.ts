import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IConstraintMetaData<TE = any> {
    columns: Array<IColumnMetaData<TE>>;
    entity: IEntityMetaData<TE>;
    name: string;
}

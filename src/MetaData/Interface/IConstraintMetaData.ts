import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from ".";

export interface IConstraintMetaData<TE = any> {
    name: string;
    entity: IEntityMetaData<TE>;
    columns: Array<IColumnMetaData<TE>>;
}

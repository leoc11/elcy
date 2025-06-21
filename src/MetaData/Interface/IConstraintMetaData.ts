import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IConstraintMetaData<TE extends object = object> {
    columns: Array<IColumnMetaData<TE>>;
    entity: IEntityMetaData<TE>;
    name: string;
}

import { IConstraintMetaData } from "./Interface/IConstraintMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class UniqueConstraintMetaData<TE = any> implements IConstraintMetaData<TE> {
    public entity: IEntityMetaData<TE, any>;
    public name: string;
    public columns: Array<IColumnMetaData<TE>>;
}

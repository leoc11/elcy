import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IConstraintMetaData } from "./Interface/IConstraintMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class UniqueConstraintMetaData<TE = any> implements IConstraintMetaData<TE> {
    constructor(public readonly name: string, public readonly entity: IEntityMetaData<TE, any>, public readonly columns: Array<IColumnMetaData<TE>>) { }
}

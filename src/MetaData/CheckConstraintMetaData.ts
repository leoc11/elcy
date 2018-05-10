import { ICheckConstraintMetaData } from "./Interface/ICheckConstraintMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";

export class CheckConstraintMetaData<TE> implements ICheckConstraintMetaData<TE> {
    public definition?: (entity: TE) => boolean;
    public checkDefinition: string;
    public name: string;
    public properties: Array<IColumnMetaData<TE>>;
}

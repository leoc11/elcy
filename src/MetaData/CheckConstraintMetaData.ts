import { ICheckConstraintMetaData } from "./Interface/ICheckConstraintMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";

export class CheckConstraintMetaData<TE> implements ICheckConstraintMetaData<TE> {
    public entity: IEntityMetaData<TE, any>;
    public definition?: FunctionExpression<TE, boolean>;
    public name: string;
    public columns: Array<IColumnMetaData<TE>>;
}

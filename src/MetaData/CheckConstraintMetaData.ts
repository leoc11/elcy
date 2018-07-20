import { ICheckConstraintMetaData } from "./Interface/ICheckConstraintMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";

export class CheckConstraintMetaData<TE> implements ICheckConstraintMetaData<TE> {
    constructor(public name: string, public readonly entity: IEntityMetaData<TE, any>, protected readonly checkFn: (entity: TE) => boolean) { }
    public definition?: FunctionExpression<TE, boolean>;
    public columns: Array<IColumnMetaData<TE>>;
}

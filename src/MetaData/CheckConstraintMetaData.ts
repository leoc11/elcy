import { ICheckConstraintMetaData } from "./Interface/ICheckConstraintMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

export class CheckConstraintMetaData<TE> implements ICheckConstraintMetaData<TE> {
    constructor(public name: string, public readonly entity: IEntityMetaData<TE, any>, protected readonly checkFn: (entity: TE) => boolean) { }
    private _definition: FunctionExpression<TE, boolean>;
    public get definition(): FunctionExpression<TE, boolean> {
        if (!this._definition) {
            this._definition = ExpressionBuilder.parse(this.checkFn);
            this._definition.params[0].type = this.entity.type;
        }
        return this._definition;
    }
    public columns: Array<IColumnMetaData<TE>> = [];
}

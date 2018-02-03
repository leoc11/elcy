import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./index";

export class SingleSelectExpression<T = any, TE = any> extends SelectExpression<T> {
    constructor(entity: IEntityExpression<T> | SelectExpression<T>, public column: IColumnExpression<TE>) {
        super(entity as any);
        this.columns = [this.column];
    }
    public getVisitParam(): IExpression {
        return this.column;
    }
}

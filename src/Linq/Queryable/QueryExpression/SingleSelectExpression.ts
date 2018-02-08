import { IExpression } from "../../../ExpressionBuilder/Expression/index";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { SelectExpression } from "./index";
import { GenericType } from "../../../Common/Type";

export class SingleSelectExpression<T = any, TE = any> extends SelectExpression<T> {
    public get type(): GenericType<T> {
        return this.column.type as any;
    }
    constructor(entity: IEntityExpression<T> | SelectExpression<T>, public column: IColumnExpression<TE>) {
        super(entity as any);
    }
    public getVisitParam(): IExpression {
        return this.column;
    }
    public clone(): SelectExpression<T> {
        return new SingleSelectExpression(this, this.column);
    }
}

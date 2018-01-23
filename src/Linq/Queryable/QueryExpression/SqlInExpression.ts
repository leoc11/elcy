import { QueryBuilder } from "../../QueryBuilder";
import { ExpressionBase, IExpression } from "../../../ExpressionBuilder/Expression/IExpression";
import { SelectExpression } from "./index";
import { ArrayValueExpression } from "../../../ExpressionBuilder/Expression/index";

export class SqlInExpression<T> extends ExpressionBase<boolean> {
    constructor(public readonly leftOperand: IExpression<T>, public readonly rightOperand: SelectExpression | ArrayValueExpression<T>) {
        super(Boolean);
    }
    public execute(_transformer: QueryBuilder): any {
        throw new Error("method not implemented");
    }
}

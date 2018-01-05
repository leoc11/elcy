import { genericType } from "../../../Common/Type";
import { FunctionExpression } from "../../../ExpressionBuilder/Expression/index";
import { ColumnExpression } from "./ColumnExpression";
import { SelectExpression } from "./SelectExpression";

export class GroupByExpression<T, K> extends SelectExpression<K> {
    public key: K;
    // resolved from keySelector
    public groupBy: ColumnExpression[];
    public type: genericType<K>;
    constructor(public readonly select: SelectExpression<T>, public readonly keySelector: FunctionExpression<T, K>, type?: genericType<K>) {
        super(select.entity);
        this.select = select;
        if (type)
            this.type = type;
    }
}

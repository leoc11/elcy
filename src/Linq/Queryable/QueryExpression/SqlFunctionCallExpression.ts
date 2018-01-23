import { genericType } from "../../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder";
import { ExpressionBase, IExpression } from "../../../ExpressionBuilder/Expression/IExpression";

export class SqlFunctionCallExpression<T> extends ExpressionBase<T> {
    constructor(public readonly type: genericType<T>, public readonly functionName: string, public params: IExpression[]) {
        super();
    }
    public execute(_transformer: QueryBuilder): any {
        throw new Error("method not implemented");
    }
}

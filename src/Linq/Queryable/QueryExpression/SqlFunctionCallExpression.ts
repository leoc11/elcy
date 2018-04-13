import { GenericType } from "../../../Common/Type";
import { ExpressionBase, IExpression } from "../../../ExpressionBuilder/Expression/IExpression";
import { QueryBuilder } from "../../QueryBuilder";

export class SqlFunctionCallExpression<T> extends ExpressionBase<T> {
    constructor(public readonly type: GenericType<T>, public readonly functionName: string, public params: IExpression[]) {
        super();
    }
    public execute(transformer: QueryBuilder): any {
        throw new Error("method not implemented");
    }
    public clone() {
        return new SqlFunctionCallExpression(this.type, this.functionName, this.params);
    }
}

import { GenericType } from "../../Common/Type";
import { ExpressionBase } from "../../ExpressionBuilder/Expression/IExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";

export class SqlExpression<T> extends ExpressionBase<T> {
    constructor(public readonly type: GenericType<T>, public readonly sqlStatement: string) {
        super();
    }
    public execute(transformer: QueryBuilder): any {
        throw new Error("method not implemented");
    }
    public clone() {
        return new SqlExpression(this.type, this.sqlStatement);
    }
}

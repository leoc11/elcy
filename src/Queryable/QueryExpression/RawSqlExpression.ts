import { GenericType } from "../../Common/Type";
import { ExpressionBase, IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";

export class RawSqlExpression<T> extends ExpressionBase<T> {
    constructor(public readonly type: GenericType<T>, public readonly sqlStatement: string) {
        super();
    }
    public execute(transformer: QueryBuilder): any {
        throw new Error("method not implemented");
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const clone = new RawSqlExpression(this.type, this.sqlStatement);
        replaceMap.set(this, clone);
        return clone;
    }
}

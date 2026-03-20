import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Util";
import { TemporaryEntityExpression } from "./TemporaryEntityExpression";
import { SqlParameterExpression } from "./SqlParameterExpression";

export class SqlTableValueParameterExpression<T extends object = object> extends SqlParameterExpression<T[]> {
    constructor(valueExp: IExpression<T[]>, public entityExp: TemporaryEntityExpression<T>) {
        super(valueExp);
    }
    public override clone(replaceMap?: Map<IExpression, IExpression>): SqlTableValueParameterExpression<T> {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const valueGetter = resolveClone(this.valueExp, replaceMap);
        const entityExp = resolveClone(this.entityExp, replaceMap);
        const clone = new SqlTableValueParameterExpression(valueGetter, entityExp);
        replaceMap.set(this, clone);
        return clone;
    }
}

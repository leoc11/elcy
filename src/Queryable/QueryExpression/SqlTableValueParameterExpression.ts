import { SqlParameterExpression } from "./SqlParameterExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { resolveClone } from "../../Helper/Util";

export class SqlTableValueParameterExpression<T = any> extends SqlParameterExpression<T[]> {
    constructor(valueExp: IExpression<T[]>, public entityExp: IEntityExpression<T>) {
        super(valueExp);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>): SqlTableValueParameterExpression<T> {
        if (!replaceMap) replaceMap = new Map();
        const valueGetter = resolveClone(this.valueExp, replaceMap);
        const entityExp = resolveClone(this.entityExp, replaceMap);
        const clone = new SqlTableValueParameterExpression(valueGetter, entityExp);
        replaceMap.set(this, clone);
        return clone;
    }
}